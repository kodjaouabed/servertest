const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcryptjs = require("bcryptjs");
const validator = require("validator");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurer Cloudinary
cloudinary.config({
  cloud_name: 'dtldeglnc',
  api_key: '298111192278727',
  api_secret: 'L-SuTGBlPf8rJ832b_Yc8NIgbu4',
});

// Configuration de la base de données
const db = mysql.createConnection({
  host: "bp8jzr5xwnrarsdyqnz8-mysql.services.clever-cloud.com",
  user: "uhqktstsmn4uvhed",
  password: "TIYvWz2xys8qL4WVGEUs",
  database: "bp8jzr5xwnrarsdyqnz8",
});

// Configurer multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données: ", err);
  } else {
    console.log("Connexion à la base de données réussie !");
  }
});

// Fonction d'exécution de requêtes MySQL
const executeQuery = async (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

// Route d'accueil
app.get("/", (req, res) => {
  res.send("Bienvenu !");
});

// Route d'inscription
app.post("/signin", async (req, res) => {
  const { identifiant, password } = req.body;
  try {
    const users = await executeQuery("SELECT * FROM user WHERE identifiant = ?", [identifiant]);
    if (users.length > 0) {
      return res.send("Utilisateur existant");
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    if (validator.isEmail(identifiant)) {
      await executeQuery("INSERT INTO user (identifiant, password, email) VALUES (?, ?, ?)", [identifiant, passwordHash, identifiant]);
    } else {
      await executeQuery("INSERT INTO user (identifiant, password) VALUES (?, ?)", [identifiant, passwordHash]);
    }

    res.send("Inscription réussie");
  } catch (err) {
    console.error("Erreur d'inscription:", err);
    res.status(500).send("Erreur d'inscription");
  }
});

// Route de connexion
app.post("/login", async (req, res) => {
  const { identifiant, password } = req.body;
  try {
    const users = await executeQuery("SELECT * FROM user WHERE identifiant = ?", [identifiant]);
    if (users.length === 0) {
      return res.send("Identifiant ou mot de passe incorrect");
    }

    const isMatch = await bcryptjs.compare(password, users[0].password);
    if (isMatch) {
      res.send("Connexion réussie");
    } else {
      res.send("Identifiant ou mot de passe incorrect");
    }
  } catch (err) {
    console.error("Erreur de connexion:", err);
    res.status(500).send("Erreur de connexion");
  }
});

// Route de mise à jour de la photo de profil
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "imagestest" },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    await executeQuery("UPDATE user SET photo = ? WHERE id = ?", [result.secure_url, req.body.id]);
    res.send("Image enregistrée");
  } catch (err) {
    console.error("Erreur de téléchargement:", err);
    res.status(500).send("Erreur de téléchargement");
  }
});

// Route pour obtenir les produits
app.get("/products", async (req, res) => {
  try {
    const products = await executeQuery("SELECT * FROM products");
    res.send(products);
  } catch (err) {
    console.error("Erreur lors de la récupération des produits:", err);
    res.status(500).send("Erreur lors de la récupération des produits");
  }
});

// Route pour voir un produit spécifique
app.post("/productview", async (req, res) => {
  const { id } = req.body;
  try {
    const product = await executeQuery("SELECT * FROM products WHERE id = ?", [id]);
    res.send(product);
  } catch (err) {
    console.error("Erreur lors de la vue produit:", err);
    res.status(500).send("Erreur lors de la vue produit");
  }
});

// Route pour la recherche de produits
app.post("/productsearch", async (req, res) => {
  const { name } = req.body;
  try {
    const products = await executeQuery("SELECT * FROM products WHERE nameProduct LIKE ?", [`%${name}%`]);
    res.send(products);
  } catch (err) {
    console.error("Erreur lors de la recherche de produits:", err);
    res.status(500).send("Erreur lors de la recherche de produits");
  }
});

// Route pour obtenir le profil d'un utilisateur
app.post("/userprofile", async (req, res) => {
  const { identifiant } = req.body;
  try {
    const user = await executeQuery("SELECT * FROM user WHERE identifiant = ?", [identifiant]);
    res.send(user);
  } catch (err) {
    console.error("Erreur lors de la récupération du profil utilisateur:", err);
    res.status(500).send("Erreur lors de la récupération du profil utilisateur");
  }
});

// Route pour changer le mot de passe
app.post("/changepassword", async (req, res) => {
  const { id, password, passwordverify } = req.body;
  try {
    const user = await executeQuery("SELECT * FROM user WHERE id = ?", [id]);
    const isMatch = await bcryptjs.compare(passwordverify, user[0].password);

    if (isMatch) {
      const newPasswordHash = await bcryptjs.hash(password, 10);
      await executeQuery("UPDATE user SET password = ? WHERE id = ?", [newPasswordHash, id]);
      res.send("Mot de passe mis à jour avec succès");
    } else {
      res.send("Mot de passe incorrect");
    }
  } catch (err) {
    console.error("Erreur de mise à jour du mot de passe:", err);
    res.status(500).send("Erreur de mise à jour du mot de passe");
  }
});

// Lancer le serveur
app.listen(3001, (err) => {
  if (err) {
    console.log("Erreur lors du démarrage de l'application");
  } else {
    console.log("Application lancée sur le port 3001");
  }
});
