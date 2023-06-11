const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const uri =
  "mongodb+srv://tanzimnahid:hUmpy9viVSYABZZg@cluster0.k2xb8qn.mongodb.net/?retryWrites=true&w=majority"

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    const classCollection = client.db("summerSchool").collection("allClass")
    const userCollection = client.db("summerSchool").collection("users")

    //save user email and role in Db
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true }

      const updatedDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    //Upload a new class from user=========================================
    app.post("/allClass", async (req, res) => {
      const doc = req.body
      const result = await classCollection.insertOne(doc)
      res.send(result)
    })

    //get all class for a current user ====================================
    app.get('/allClass/:email',async (req,res)=>{
      const email = req.params.email;
      const query = {instructor_email:email}
      const result = await classCollection.find(query).toArray();
      res.send(result)
    })

    

    //Get all class from database =========================================
    app.get("/allClass", async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })



    //Get popular  class from database ====================================
    app.get("/popularClass", async (req, res) => {
      const query = { enrolled_classes: { $gt: 5 } }
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })
    //get all login users =================================================
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email
      const query = { email: email }

      const result = await userCollection.findOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.get("/", (req, res) => {
  res.send("summer camp Server is running..")
})

app.listen(port, () => {
  console.log(`summer camp is running on port ${port}`)
})
