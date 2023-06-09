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

    //Get all class from database =========================================
    app.get("/allClass", async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })

    
    //Get popular  class from database =========================================
    app.get("/popularClass", async (req, res) => {
      const query = { enrolled_classes: { $gt: 5 } };
      const result = await classCollection.find(query).toArray()
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
