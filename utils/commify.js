const commify = (credits) => {
  if (/^[0-9]?[0-9]$/.test(credits)) {
    return `${credits},0`
  }

  return credits
}

module.exports = {
  commify
}
