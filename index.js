const express = require('express')
const bcrypt = require('bcrypt')
const MongoClient = require('mongodb').MongoClient
const app = express()
const port = 5000

app.use(express.json())

const uri =
  'mongodb+srv://admin:admin@cluster0.yhsfeme.mongodb.net/capacit_db/?retryWrites=true&w=majority'
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide username, email, and password' })
    }

    const db = client.db('test')
    const users = db.collection('users')

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'User with this email already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = { username, email, password: hashedPassword }
    await users.insertOne(user)

    return res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ error: 'An error occurred while registering the user' })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide email and password' })
    }

    const db = client.db('test')
    const users = db.collection('users')

    const user = await users.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' })
    }

    return res.status(200).json({ message: 'Logged in successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'An error occurred while logging in' })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
