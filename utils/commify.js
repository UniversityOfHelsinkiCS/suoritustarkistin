const commify = (credits) => {
  console.log(credits)

  if (/(,[05])$/.test(credits)) {
    console.log('comma found')

    return credits
  }

  console.log('no comma')

  return credits.concat(',0')
}

module.exports = {
  commify,
}
