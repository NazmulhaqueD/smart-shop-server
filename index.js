const express = require('express')
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 5000
 

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkn4tqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const database = client.db('smartShop');
        const productsCollection = database.collection('products');
        const usersCollection=database.collection("users")

        app.get('/products', async (req, res) => {
            const { category, name, id } = req.query;
            const filter = {};

            if (category) {
                filter.category = category;
            }
            if (name) {
                filter.name = { $regex: name, $options: 'i' };
            }
            if (id) {
                filter._id = new ObjectId(id);
            }
            const result = await productsCollection.find(filter).toArray();
            res.send(result);
        })
        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;  // params থেকে id নিলাম
            const result = await productsCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });
        app.post('/products', async (req, res) => {
            const data = req.body;
            const result = await productsCollection.insertOne(data);
            res.send(result);
        })
           app.post('/users', async (req, res) => {
      const userData = req.body;

      // Optional: check if user already exists by email
      const existingUser = await usersCollection.findOne({ email: userData.email });
      if (existingUser) {
        return res.status(409).send({ message: 'User already exists' });
      }

      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });
       // ✅ Get all users
    // app.get('/users', async (req, res) => {
    //   const users = await usersCollection.find().toArray();
    //   res.send(users);
    // });

    // ✅ Get single user by email or id
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    app.put("/users/:email", async (req, res) => {
  const email = req.params.email;
  const updatedData = req.body;
  const result = await usersCollection.updateOne(
    { email },
    { $set: updatedData }
  );
  res.send(result);
});

// Get a user's role by email
app.get("/users/:email/role", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(404).send({ message: "User not found" });

    res.send({ role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});


        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }

    finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
