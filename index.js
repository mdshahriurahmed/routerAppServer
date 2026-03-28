const express = require('express')
var cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express()

const port = process.env.PORT || 5000

// midleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// uname: 
// pass:



const uri = `mongodb+srv://shahriurahmedcse_db_user:cyEljaq6SYPC7qvZ@cluster0.tvjrc2r.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = (req, res, next) => {
    console.log("inside verify", req.cookies);
    const token = req.cookies.token
    if (!token) { return res.status(401).send({ message: 'unauthorized access' }) }
    jwt.verify(token, '9ec6823a06e87c439a79581dafbb3588c2f1305ba5badc9b6b57b22c2a76c96454a478cddfb5c04bf7f1602e4148c4763ea186359e394418b865b51c0b35c8d4', (err, decoded) => {
        if (err) { return res.status(401).send({ message: 'unauthorized access' }) }
        next();
    })
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const postsColl = client.db("postApp").collection("posts");




        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: false, //false for developer mode and true for production 
                sameSite: 'lax'
            })
            res.send({ success: true })
        })


        app.get('/ourpost/:_id', async (req, res) => {
            const _id = req.params._id;
            const post = { _id: new ObjectId(_id) };
            const result = await postsColl.findOne(post);
            res.send(result)
        })
        app.delete('/deletepost/:_id', async (req, res) => {
            const _id = req.params._id;
            console.log("id is:", _id);

            const post = { _id: new ObjectId(_id) };
            const result = await postsColl.deleteOne(post);
            res.send(result)
        })

        app.post('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: false,   // production হলে true
                sameSite: 'lax'
            })
            res.send({ success: true })
        })

        app.put('/post/:_id', async (req, res) => {
            const _id = req.params._id;
            console.log(_id);
            const post = { _id: new ObjectId(_id) };
            const newTitle = req.body;


            const updateDoc = {
                $set: { title: `${newTitle.title}` },
            };
            const result = await postsColl.updateOne(post, updateDoc);
            res.send(result);

        })

        app.get('/ourpost', async (req, res) => {
            const p = await postsColl.find().toArray()
            console.log('cookies', req.cookies);
            res.send(p)
        })

        app.post('/addpost', verifyToken, async (req, res) => {
            const post = req.body;
            console.log(post);

            const result = await postsColl.insertOne(post);
            res.send(result)

        })
    } finally {
        // Ensures that the client will close when you finish/error

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Router app is running")
})



app.listen(port, () => {
    console.log(` app running on port ${port}`)
})