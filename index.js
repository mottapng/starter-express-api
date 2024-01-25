const express = require('express')
const bcrypt = require('bcrypt')
const MongoClient = require('mongodb').MongoClient
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const app = express()
const port = 5000

app.use(express.json())

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Authentication API',
      version: '1.0.0',
      description: 'A simple Express API for user registration and login',
    },
    servers: [
      {
        url: 'https://timerapi.cyclic.app',
      },
    ],
  },
  apis: ['index.js'],
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User with this email already exists or missing fields
 *       500:
 *         description: An error occurred while registering the user
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       400:
 *         description: User not found or Invalid password
 *       500:
 *         description: An error occurred while logging in
 */
