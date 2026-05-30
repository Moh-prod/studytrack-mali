const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Chargement de la clé d'administration
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'Erreur : Le fichier "serviceAccountKey.json" est introuvable.');
  console.log('Veuillez télécharger votre clé privée depuis la console Firebase et la placer à la racine.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportNewsletter() {
  console.log('Connexion à Firestore...');
  try {
    const snapshot = await db.collection('newsletter_subscribers').orderBy('subscribedAt', 'desc').get();
    
    if (snapshot.empty) {
      console.log('Aucun abonné trouvé dans la collection "newsletter_subscribers".');
      return;
    }

    // Préparation des lignes CSV
    const csvRows = ['Email,Date d\'inscription'];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // On échappe les virgules au cas où
      const email = data.email ? data.email.replace(/"/g, '""') : '';
      const date = data.subscribedAt || '';
      csvRows.push(`"${email}","${date}"`);
    });

    const csvContent = csvRows.join('\n');
    const outputPath = path.join(__dirname, 'subscribers.csv');
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', `✓ Succès ! ${snapshot.size} abonnés ont été exportés dans "${outputPath}".`);
  } catch (error) {
    console.error('Erreur lors de l\'exportation :', error);
  }
}

exportNewsletter();
