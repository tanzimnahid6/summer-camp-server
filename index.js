const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)

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
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k2xb8qn.mongodb.net/?retryWrites=true&w=majority`

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
    const selectClassCollection = client
      .db("summerSchool")
      .collection("selected")
    const paymentCollection = client.db("summerSchool").collection("payment")
    const instructorsCollection = client.db("summerSchool").collection("popularInstructore")


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

    //get all popular instructore data======================
    app.get('/popularInstructors',async (req,res)=>{
      const result = await instructorsCollection.find().toArray()
      res.send(result)
    })

    // get instructors data===============================================
    app.get('/instructors/',async (req,res)=>{
     
      const query = {role:"instructor"}
      const result = await userCollection.find(query).toArray()
      res.send(result)
      
    })

    //Upload a new class from user=========================================
    app.post("/allClass", async (req, res) => {
      const doc = req.body
      const result = await classCollection.insertOne(doc)
      res.send(result)
    })

    //get all class for a current user ====================================
    app.get("/allClass/:email", async (req, res) => {
      const email = req.params.email
      const query = { instructor_email: email }
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })

    //Get all class from database =========================================
    app.get("/allClass", async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })

    //get all approved classes ==============================================
    app.get("/approvedClass", async (req, res) => {
      const query = { status: "approved" }
      const result = await classCollection.find(query).toArray()
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
    //get a user from his email===========================================
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await userCollection.findOne(query)
      res.send(result)
    })

    //update course status ==============================================
    app.put("/allClass/:id", async (req, res) => {
      const id = req.params.id
      const body = req.body
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: body.status,
        },
      }
      const result = await classCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    //update course feedback ==============================================
    app.put("/feedBack/:id", async (req, res) => {
      const id = req.params.id
      const body = req.body
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          feedback: body.feedback,
        },
      }
      const result = await classCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    //update user role====================================================\
    app.put("/updateUserRole/:id", async (req, res) => {
      const id = req.params.id
      const body = req.body
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }

      const updateDoc = {
        $set: {
          role: body.role,
        },
      }

      const result = await userCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    //save user select class to database==================================
    app.post("/selectClass", async (req, res) => {
      const selectClass = req.body
      const isExist = await selectClassCollection.findOne(selectClass)

      if (isExist) {
        const message = { warning: true }
        res.send(message)
      } else {
        const result = await selectClassCollection.insertOne(selectClass)
        res.send(result)
      }
    })

    //get selected class===================================================
    app.get("/selectClass/:email", async (req, res) => {
      const email = req.params.email
      const query = { userEmail: email }
      const result = await selectClassCollection.find(query).toArray()
      res.send(result)
    })

    //Delete selected data============================================
    app.delete("/selectClass/:id", async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const result = await selectClassCollection.deleteOne(filter)
      res.send(result)
    })

    //create payment intent=========================================================================================
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)
      if (!amount) {
        return
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })

    //payment related api==========================
    app.post("/payments", async (req, res) => {
      const payment = req.body
      const result = await paymentCollection.insertOne(payment)
      const id = payment.itemId
      const query = { _id: new ObjectId(id) }
      // console.log(query)
      const deletedResult = await selectClassCollection.deleteOne(query)


      res.send(result)
    })

    //get all payment class by email ====================================
    app.get("/payment/:email", async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const sortCriteria = { date: -1 }
      const result = await paymentCollection.find(query).sort(sortCriteria).toArray()
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
