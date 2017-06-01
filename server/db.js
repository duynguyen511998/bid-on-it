module.exports = {
  getAllListings,
  getCurrentListings,
  getExpiredListings,
  getOneListing,
  getUserListings,
  addListing,
  addBid,
  getListingsWon,
  getListingsLost,
  getListingsWatching
}

const data = require('./data.js')

function getAllListings (callback) {
  let listings = data.listings.map(listing => {
    listing.user_name = data.users.find(user => user.id === listing.user_id).user_name
    listing.bids = data.bids.filter(bid => bid.listing_id === listing.id)
    listing.number_of_bids = listing.bids.length
    listing.current_bid = listing.starting_bid
    if (listing.number_of_bids > 0) {
      listing.current_bid = listing.bids.sort((a, b) => b.bid_amount - a.bid_amount)[0].bid_amount
    }
    return listing
  })
  return callback(null, listings)
}

function getCurrentListings (callback) {
  getAllListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    const d = new Date()
    listings = listings.filter(listing => listing.finish_date > d)
    return callback(null, listings)
  })
}

function getExpiredListings (callback) {
  getAllListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    const d = new Date()
    listings = listings.filter(listing => listing.finish_date < d)
    return callback(null, listings)
  })
}

function getOneListing (id, callback) {
  id = Number(id)
  const listing = data.listings.find(x => x.id === id)
  if (!listing) {
    return callback('There are no listings with that id')
  }
  listing.user_name = data.users.find(user => user.id === listing.user_id).user_name
  if (listing.winner) {
    listing.winner_name = data.users.find(user => user.id === listing.winner).user_name
  }
  let bids = data.bids.filter(bid => bid.listing_id === listing.id)
  bids.sort((a, b) => b.bid_amount - a.bid_amount)
  listing.current_bid = listing.starting_bid
  if (bids.length > 0) {
    listing.current_bid = bids[0].bid_amount
  }
  listing.bids = bids.map(bid => {
    bid.user_name = data.users.find(user => user.id === bid.user_id).user_name
    return bid
  })

  return callback(null, listing)
}

function getUserListings (userId, callback) {
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  getCurrentListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    listings = listings.filter(listing => listing.user_id === userId)
    return callback(null, listings)
  })
}

function addListing (listingData, userId, callback) {
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  if (!listingData.name || listingData.name.length === 0) {
    return callback('Please enter a name')
  }
  if (!listingData.startingBid || listingData.startingBid.length === 0) {
    return callback('Please enter a starting bid')
  }
  if (!listingData.description || listingData.description.length === 0) {
    return callback('Please enter a description')
  }
  if (isNaN(Number(listingData.startingBid))) {
    return callback('Please enter a valid starting bid')
  }
  const currentDate = new Date()
  let listing = {
    id: data.listings.sort((a, b) => a.id - b.id)[data.listings.length - 1].id + 1,
    user_id: Number(userId),
    name: listingData.name,
    description: listingData.description,
    picture_url: listingData.pictureUrl,
    starting_bid: Number(listingData.startingBid),
    start_date: currentDate,
    finish_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7, currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds())
  }
  if (!listingData.pictureUrl || listingData.pictureUrl.length === 0) {
    listing.picture_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/600px-No_image_available.svg.png'
  }
  data.listings.push(listing)
  return callback(null, listing.id)
}

function addBid (bidAmount, userId, listingId, callback) {
  if (isNaN(Number(bidAmount))) {
    return callback('Please enter a valid starting bid')
  }
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  listingId = Number(listingId)
  getOneListing(listingId, (error, listing) => {
    if (error) {
      return callback(error)
    }
    let currentDate = new Date()
    if (listing.finish_date < currentDate) {
      return callback('That auction has already ended')
    }
    if (listing.user_id === userId) {
      return callback('You cannot bid on your own listings')
    }
    if (Math.floor(Number(bidAmount) * 100) / 100 <= listing.bids[listing.bids.length - 1].bid_amount) {
      return callback('Please enter a bid that is larger than the previous one')
    }
    let bid = {
      id: data.bids.sort((a, b) => b.id - a.id)[0].id + 1,
      listing_id: listingId,
      bid_amount: Number(bidAmount),
      user_id: Number(userId),
      bid_date: new Date()
    }
    data.bids.push(bid)
    return callback(null, bid.id)
  })
}

function getListingsWon (userId, callback) {
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  getExpiredListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    listings = listings.filter(listing => listing.winner === userId)
    return callback(null, listings)
  })
}

function getListingsLost (userId, callback) {
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  getExpiredListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    listings = listings.filter(listing => listing.winner !== userId)
    listings = listings.filter(listing => listing.bids.find(bid => bid.user_id === userId))
    return callback(null, listings)
  })
}

function getListingsWatching (userId, callback) {
  userId = Number(userId)
  let user = data.users.find(user => user.id === userId)
  if (!user) {
    return callback('There is no user with that ID')
  }
  getCurrentListings((error, listings) => {
    if (error) {
      return callback(error)
    }
    listings = listings.filter(listing => listing.bids.find(bid => bid.user_id === userId))
    return callback(null, listings)
  })
}