const express=require("express")
const cors=require("cors")
const mysql=require("mysql")
const bcryptjs=require("bcryptjs")
const validator=require('validator')
const multer=require("multer")


const app=express()

app.use(cors()); // CORS pour les requêtes entre serveurs
app.use(express.json()); // Pour traiter les JSON (sans body-parser)
app.use(express.urlencoded({ extended: true })); // Pour traiter les URL-encoded






const cloudinary = require('cloudinary').v2;

const db=mysql.createPool({
    connectionLimit:3,
    host:"bp8jzr5xwnrarsdyqnz8-mysql.services.clever-cloud.com",
    user:"uhqktstsmn4uvhed",
    password:"TIYvWz2xys8qL4WVGEUs",
    database:"bp8jzr5xwnrarsdyqnz8"
})

cloudinary.config({
   cloud_name: 'dtldeglnc',
   api_key: '298111192278727',
   api_secret: 'L-SuTGBlPf8rJ832b_Yc8NIgbu4',
 });

 const storage = multer.memoryStorage()
 
 const upload = multer({ storage });



 app.post("/upload",upload.single("file"),(req,res)=>{
 
   const uploadcloudinary=cloudinary.uploader.upload_stream(
      {folder:"imagestest"},
      (err,result)=>{
          if (err) {
              console.log(err)
          } else {
            const sql="UPDATE user SET photo=? WHERE id=?"
            db.query(sql,[result.secure_url,req.body.id],(err,data)=>{
               if (err) {
                console.log(err)
               } else {
                  res.send("recorded image")
               }
            }) 
          }
      }
  )
  uploadcloudinary.end(req.file.buffer);
 })



app.get('/',(req,res)=>{
      res.send('bienvenu')
})


app.post('/sigin',(req,res)=>{
    const identifiant=req.body.identifiant
    const password=req.body.password


    const sql="SELECT*FROM user WHERE identifiant=?"

    db.query(sql,[identifiant],(err,data)=>{
        if (err) {
           res.send("registration error")
        } else {
         if (data.length>0) {
            res.send("existing user")
         }else{
            bcryptjs.hash(password,10,(err,passwordhash)=>{
                if (err) {
                    res.send("registration error")
                } else {
                    if (validator.isEmail(identifiant)) {
                     const sql="INSERT INTO user (identifiant,password,email) VALUES (?,?,?)"
                     db.query(sql,[identifiant,passwordhash,identifiant],(err,data)=>{
                       if (err) {
                          res.send("registration error")
                       } else {
                          res.send("successful registration")
                       }
                    })
                    } else {
                     const sql="INSERT INTO user (identifiant,password) VALUES (?,?)"
                     db.query(sql,[identifiant,passwordhash],(err,data)=>{
                       if (err) {
                          res.send("registration error")
                       } else {
                          res.send("successful registration")
                       }
                    })
                    } 
                }
            })
         }
        }
     }) 
    
   
})


app.post('/login',(req,res)=>{
    const identifiant=req.body.identifiant
    const password=req.body.password
    
    const sql="SELECT*FROM user WHERE identifiant=?"
            db.query(sql,[identifiant],(err,data)=>{
               if (err) {
                  res.send("registration error")
               } else {
                  //res.send("successful registration")
                  if (data.length>0) {
                    bcryptjs.compare(password,data[0].password,(err,result)=>{
                         if (err) {
                            res.send("incorrect username or password")
                         } else {
                            if (result===true) {
                               res.send("connection successful")
                            } else {
                                res.send("incorrect username or password")
                            }
                         }
                    })
                  } else {
                    res.send("incorrect username or password")
                  }
               }
          
    })
})





app.get('/products',(req,res)=>{

    const sql="SELECT*FROM products"

    db.query(sql,[],(err,data)=>{
        if (err) {
         console.log(err)
        } else {
         res.send(data)
        }
     }) 
    
   
})



app.post('/productview',(req,res)=>{
    const id=req.body.id
    const sql="SELECT*FROM products WHERE id=?"

    db.query(sql,[id],(err,data)=>{
        if (err) {
         console.log(err)
        } else {
         res.send(data)
        }
     }) 
    
   
})


app.post('/productsingle',(req,res)=>{
   const categorie=req.body.categorie
   const sql="SELECT*FROM products WHERE categorie=?"

   db.query(sql,[categorie],(err,data)=>{
       if (err) {
        console.log(err)
       } else {
        res.send(data)
       }
    }) 
   
  
})



app.post('/productsimilar',(req,res)=>{
   const categorie=req.body.categorie
   const id=req.body.id
   const sql="SELECT*FROM products WHERE categorie=? AND id!=?"

   db.query(sql,[categorie,id],(err,data)=>{
       if (err) {
        console.log(err)
       } else {
        res.send(data)
       }
    }) 
   
  
})




app.post('/productsearch',(req,res)=>{
   const name=req.body.name
   const sql="SELECT*FROM products WHERE nameProduct LIKE ? "

   db.query(sql,[`%${name}%`],(err,data)=>{
       if (err) {
        console.log(err)
       } else {
        res.send(data)
       }
    }) 
   
  
})




app.post('/userprofile',(req,res)=>{
   const identifiant=req.body.identifiant
   
   const sql="SELECT*FROM user WHERE identifiant=?"
           db.query(sql,[identifiant],(err,data)=>{
              if (err) {
                 console.log(err)
              } else {
                 res.send(data)
              }
         
   })
})


app.post('/changepassword',(req,res)=>{
   const id=req.body.id
   const password=req.body.password
   const passwordverify=req.body.passwordverify
   
   const sql="SELECT*FROM user WHERE id=?"
           db.query(sql,[id],(err,data)=>{
              if (err) {
                 console.log(err)
              } else {
               bcryptjs.compare(passwordverify,data[0].password,(err,result)=>{
                  if (err) {
                     res.send("incorrect password")
                  } else {
                     if (result===true) {
                        bcryptjs.hash(password,10,(err,passwordhash)=>{
                           if (err) {
                              res.send("incorrect password")
                           } else {
                              const sql="UPDATE user SET password=? WHERE id=?"
                              db.query(sql,[passwordhash,id],(err,data)=>{
                                 if (err) {
                                    console.log(err)
                                 } else {
                                    res.send("successful updte password")
                                 }
                            
                      })
                           }
                        })
                        
                     } else {
                         res.send("incorrect password")
                     }
                  }
             })
              }
         
   })
})










app.post('/save',(req,res)=>{
 const  {id,passwordverify,email,pincode,address,city,country,state,banckaccountnumber,banckaccountname,ifsc}=req.body
   

   const sql="SELECT*FROM user WHERE id=?"
   db.query(sql,[id],(err,data)=>{
      bcryptjs.compare(passwordverify,data[0].password,(err,result)=>{
            if (err) {
               console.log(err)
            } else {
               if (result===true) {
               const sql="UPDATE user SET email=?,pincode=?,address=?,city=?,state=?,country=?,banckaccountnumber=?,banckaccountname=?,ifsccode=?  WHERE id=?"
               db.query(sql,[email===""?data[0].email:email,pincode===""?data[0].pincode:pincode,address===""?data[0].address:address,city===""?data[0].city:city,state===""?data[0].state:state,country===""?data[0].country:country,banckaccountnumber===""?data[0].banckaccountnumber:banckaccountnumber,banckaccountname===""?data[0].banckaccountname:banckaccountname,ifsc===""?data[0].ifsccode:ifsc,id],(err,data)=>{
               if (err) {
                  console.log(err)
               } else {
                  res.send("successful updte")
               }     
               })  
               } else {
                  res.send("incorrect password")
               }
            }
      })
   })
})


app.post('/buynowcommande',(req,res)=>{
   const id=req.body.id
   const qte=req.body.qte
   const size=req.body.size
   const iduser=req.body.iduser
   const name=req.body.name
   const total=req.body.total
   const products=[{id,id,name:name,size:size,quantity:qte,iduser:iduser}]
   const sql="SELECT*FROM products WHERE id=?"

   db.query(sql,[id],(err,data)=>{
       if (err) {
        console.log(err)
       } else {
       const quantity=data[0].quantity-qte
       const sql='UPDATE products SET quantity=? WHERE id=?'
       db.query(sql,[quantity,id],(err,data)=>{
            if (err) {
               console.log(err)
            } else {
               const date=new Date()
               const sql="INSERT INTO commande (products,date,iduser,total) VALUES (?,?,?,?)"
               db.query(sql,[JSON.stringify(products),date.toISOString(),iduser,total],(err,data)=>{
                     if (err) {
                       console.log(err)
                     } else {
                       res.send("order validated")
                     }
               })
            }
       })
       }
    }) 
})






app.post('/commande',(req,res)=>{
   const cart=req.body.cart
   const iduser=req.body.user
   const total=req.body.total

   cart.map((product,key)=>{
        const sql="SELECT*FROM products WHERE id=?"
        db.query(sql,[product.id],(err,data)=>{
             if (err) {
               console.log(err)
             } else {
            const quantity=data[0].quantity-product.quantity
            
            const sql='UPDATE products SET quantity=? WHERE id=?'
            db.query(sql,[quantity,product.id],(err,data)=>{
             if (err) {
               console.log(err)
             } else {
               
             }
        })

             }
        })
   })
   

      const date=new Date()
      const sql="INSERT INTO commande (products,date,iduser,total) VALUES (?,?,?,?)"
      db.query(sql,[JSON.stringify(cart),date.toISOString(),iduser,total],(err,data)=>{
            if (err) {
              console.log(err)
            } else {
              res.send("order validated")
            }
      })

})







app.listen(3001,(err)=>{
    if (err) {
        console.log('erreur')  
    } else {
        console.log('application lancer sur le port 3001') 
    }
})