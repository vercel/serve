// Native
const path = require('path')

// Packages
const test = require('ava')
const fetch = require('node-fetch')
const sleep = require('then-sleep')
const detect = require('detect-port')

// Utilities
const api = require('../lib/api')

test('blocks ignores', async t => {
  const port = await detect(5000)
  const { stop } = api(path.join(__dirname, 'fixtures', 'security'), {
    ignore: ['test.txt'],
    port
  })

  await sleep(5000)

  const res = await fetch(`http://localhost:${port}/test.txt`)
  t.is(res.status, 404)
  stop()
})

test('blocks ignores even when requesting urlencoded url', async t => {
  const port = await detect(5000)
  const { stop } = api(path.join(__dirname, 'fixtures', 'security'), {
    ignore: ['test.txt'],
    port
  })

  await sleep(5000)

  const res = await fetch(`http://localhost:${port}/t%65st.txt`)
  t.is(res.status, 404)
  stop()
})
