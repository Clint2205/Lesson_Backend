const express = require('express');
const cors = require('cors');
const { connectToMongoDB, getDB } = require('./mongoDB');
const { ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const port = process.env.PORT || 3000;


const app = express();

app.use(express.json())
app.use(cors());
//Console logger with short format
app.use(morgan('short'));

app.use('/public/images', function (req, res, next) {
    const imagePath = path.join(__dirname, 'public/images', req.url);

    // Check if the image file exists
    fs.access(imagePath, fs.constants.F_OK, function (err) {
        if (err) {

            console.error('Image' + req.url + 'not found');
            res.status(404).send('Image not found');
        } else {
            // if Image exists, serve it
            express.static(path.join(__dirname, 'public/images'))(req, res, next);
        }
    });
});

// Static files from the 'School_Class_App' directory
app.use(express.static(path.join(__dirname, '..', 'School_Class_App',)));



// Middleware to handle dynamic collection names
app.param('collectionName', function (req, res, next, collectionName) {
    req.collection = getDB().collection(collectionName);
    return next();
});

app.get('/search/collections/:collectionName/:query', (req, res) => {
   
    const collectionName = req.params.collectionName;
    req.collection = getDB().collection(collectionName);
    console.log('collectionName:', collectionName);

    const searchTerm = req.params.query;

   
    if (!req.collection) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    req.collection.find({
        $or: [
            { subject: { $regex: searchTerm, $options: 'i' } },
            { location: { $regex: searchTerm, $options: 'i' } }
        ]
    }).toArray((err, searchResults) => {
        if (err) {
            console.error('Error during search:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json(searchResults);
    });
});



app.get('/collections/:collectionName'
    , function (req, res, next) {
        console.log('Request received for collection:', req.params.collectionName);
        req.collection.find({}).toArray(function (err, results) {
            if (err) {
                return next(err);
            }
            res.send(results);
            console.log(results);
        });
    });

// Example route setup
app.get('/collections/products/search/:query', (req, res) => {
    const searchTerm = req.params.query;
    console.log('req.collection:', req.collection);

    // Make sure req.collection is properly set using the middleware or other means.
    if (!req.collection) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    req.collection.find({
        $text: { $search: searchTerm }
    }).toArray((err, searchResults) => {
        if (err) {
            console.error('Error during search:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json(searchResults);
    });
});









app.get('/collections/:collectionName/:id'
    , function (req, res, next) {
        req.collection.findOne({ _id: new ObjectId(req.params.id) }, function (err, results) {
            if (err) {
                return next(err);
            }
            res.send(results);
        });
    });
app.post('/collections/:collectionName', function (req, res, next) {
    const collectionName = req.params.collectionName;
    const newElement = req.body;

    req.collection = getDB().collection(collectionName);

    req.collection.insertOne(newElement, function (err, result) {
        if (err) {
            return next(err);
        }

        res.send(result);
    });
});



app.delete('/collections/:collectionName/:id'
    , function (req, res, next) {
        req.collection.deleteOne({ _id: new ObjectId(req.params.id) }, function (err, results) {
            if (err) {
                return next(err);
            }
            res.send(results);
        });
    });


// If the lessonIDs and spaces are provided,filter based on lesson IDs and
//update spaces field in the products collection.
// Handle updating available spaces in the products table
app.put('/collections/:collectionName', function (req, res, next) {
    const lessonIDs = req.body.lessonIDs;
    const spaces = req.body.spaces;

    if (lessonIDs !== undefined && spaces !== undefined) {

        req.collection.updateOne(
            { lesson_id: { $in: lessonIDs } },
            { $set: { spaces: parseInt(spaces) } },
            function (err, result) {
                if (err) {
                    return next(err);
                }
                res.json({ message: "Spaces updated successfully in the products collection" });
                console.log(" Updated Result:", result);
            }
        );
    } else if (result.matchedCount === 0) {
        res.json({ message: "Invalid lesson IDs or spaces provided for update" });
    }
});
// app.get('/collections/products',  function (req, res, next) {
//     try {
//       console.log('Request received for collection:', req.params.collectionName);
//       const results =  req.collection.find({}).toArray();
//       res.send(results);
//       console.log(results);
//     } catch (error) {
//       console.error('Error in /collections/:collectionName:', error);
//       res.status(500).send('Internal Server Error');
//     }
//   });




app.use(function (req, res) {
    res.status(404).send("File not found")
});

connectToMongoDB().then(() => {
    app.listen(port, function (err) {
        if (err) console.log('Error connecting to port.')
        console.log('Server is listening on port http://localhost:' + port)
    })
});