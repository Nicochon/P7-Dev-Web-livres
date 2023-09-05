const Book = require('../models/book');
const fs = require('fs');
const sharp = require("sharp");

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id; //va être généré automatiquement par la base de données donc on supprime l'ancien
    delete bookObject.ratings.userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId, //extraction du userID grace au middleware
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` //multer donne que le nom de l'objet pas l'url
    });
    book.save()
        .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
        .catch(error => { res.status(400).json( { error })})
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
        _id: req.params.id
    }).then(
        (book) => {
            res.status(200).json(book);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId !== req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.updateOne({_id: req.params.id}, {...bookObject, _id: req.params.id})
                        .then(() => res.status(200).json({message: 'Objet modifié!'}))
                        .catch(error => res.status(401).json({error}));
                });
            }
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
};


// exports.modifyBook = (req, res, next) => {
//     const bookObject = req.file ? {
//         ...JSON.parse(req.body.book),
//         imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
//     } : { ...req.body };
//
//     delete bookObject._userId;
//
//     Book.findOne({_id: req.params.id})
//         .then((book) => {
//             if (book.userId !== req.auth.userId) {
//                 res.status(401).json({ message : 'Not authorized'});
//             } else {
//                 const filename = book.imageUrl.split('/images/')[1];
//
//                 // Read the new image file
//                 const newImageBuffer = fs.readFileSync(req.file.path);
//
//                 const newFilename = `compressed_${filename}`; // New filename for the compressed image
//
//                 // Apply compression using Sharp to the new image
//                 sharp(newImageBuffer)
//                     .webp({ quality: 20 }) // You can adjust the compression quality here
//                     .toFile(`images/${newFilename}`, (err, info) => {
//                         if (err) {
//                             res.status(500).json({ error: err.message });
//                         } else {
//                             // Update the book with the new compressed image URL
//                             Book.updateOne({ _id: req.params.id}, { ...bookObject, imageUrl: `${req.protocol}://${req.get('host')}/images/${newFilename}`, _id: req.params.id})
//                                 .then(() => {
//                                     // Delete the original file after updating
//                                     fs.unlink(req.file.path, () => {
//                                         res.status(200).json({message : 'Objet modifié!'});
//                                     });
//                                 })
//                                 .catch(error => res.status(401).json({ error }));
//                         }
//                     });
//             }
//         })
//         .catch((error) => {
//             res.status(500).json({ error });
//         });
// };


exports.deleteBook= (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId !== req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};

exports.getAllBook = (req, res, next) => {
    Book.find()
        .then(
        (book) => {
            res.status(200).json(book);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.userRating = (req, res, next ) =>{
    Book.findOne({_id: req.params.id})
        .then((book)=>{
            const rateObject = book.ratings.push(req.body);
            book.save()
                .then((book) => {
                    const array1 = book.ratings;
                    var total = 0;
                    array1.forEach(function(item){
                        if (item.grade >= 1){
                            total += item.grade;
                        }else{
                            total += item.rating;
                        }
                    })
                    const avrg = total / array1.length;
                    const avrgDecimal = avrg.toFixed(2)
                    book.averageRating = avrgDecimal
                    book.save()
                        .then((book) => {
                        res.status(200).json(book);
                    })
                })
                .catch(error => { res.status(405).json( { error })})
        })
        .catch(error => { res.status(401).json({ error })})
};

// exports.bigThree = (req, res, next ) =>{
//     Book.find()
//         .then(
//             (book) => {
//                 var allAverageRating = []
//                 book.forEach(function(item){
//                     allAverageRating.push(item.averageRating) ;
//                 })
//                 allAverageRating.sort((a, b) => a - b);
//                 const bestBook =  allAverageRating.slice(-3);
//
//                 var arrayBestBook = []
//                 bestBook.forEach(function (items){
//                     book.forEach(function(item){
//                         if (items === item.averageRating){
//                             arrayBestBook.push(item);
//                         }else{
//                            null
//                         }
//                     })
//                 })
//                 arrayBestBook.sort((a, b) => a - b);
//                 var unique = Array.from(new Set(arrayBestBook));
//                 console.log(unique);
//                 res.status(200).json(unique.slice(-3));
//             }
//         ).catch(
//         (error) => {
//             res.status(400).json({
//                 error: error
//             });
//         }
//     );
// };

exports.bigThree = (req, res, next ) =>{
    Book.find().sort({ "averageRating": -1 }).limit(3)
        .then(
            (book) => {
                res.status(200).json(book);
            }
        ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

