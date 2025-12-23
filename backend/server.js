const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const fs = require('fs'); // For file persistence

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Use env in production

// Data directory and files
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLANTS_FILE = path.join(DATA_DIR, 'plants.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory');
}

// Initialize files if they don't exist
function initializeFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        console.log(`Initialized ${path.basename(filePath)}`);
    }
}

// Load data from file
function loadData(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${path.basename(filePath)}:`, error);
        return [];
    }
}

// Save data to file
function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving ${path.basename(filePath)}:`, error);
        return false;
    }
}

// Load initial data
let orders = loadData(ORDERS_FILE);
let users = loadData(USERS_FILE);
let plants = loadData(PLANTS_FILE);

// If plants.json is empty, use your hardcoded plants (COMPLETE ARRAY)
if (plants.length === 0) {
    plants = [
        // Medicinal Plants
        { id: 1, name: "Adulsa", category: "medicinal", price: 30, image: "https://nurserylive.com/cdn/shop/products/nurserylive-g-vasaka-adusa-justicia-adhatoda-plant_600x600_efa306b0-8230-4755-b1eb-ec26df596251-857518_600x600.webp?v=1679751794", description: "Adulasa is known for its medicinal properties, particularly in respiratory health.", stock: 50, featured: true },
        { id: 2, name: "Bryophyllum", category: "medicinal", price: 30, image: "https://plantsguru.com/cdn/shop/files/plants-guru-medicinal-plants-panfuti.jpg?v=1735618433", description: "Bryophyllum is used in traditional medicine for treating infections and inflammation.", stock: 45, featured: false },
        { id: 3, name: "Indian Pennywort", category: "medicinal", price: 30, image: "https://thebaghstore.com/wp-content/uploads/2021/05/Brahmi-image-2-1200x1200.jpg", description: "Indian Pennywort is renowned for its memory-enhancing properties.", stock: 40, featured: true },
        { id: 4, name: "Ajwain", category: "medicinal", price: 30, image: "https://gachwala.in/wp-content/uploads/2022/06/8162dToRyhL.jpg", description: "Ajwain is used for digestive health and has aromatic properties.", stock: 35, featured: false },
        { id: 5, name: "Tulsi", category: "medicinal", price: 20, image: "https://media.post.rvohealth.io/wp-content/uploads/2020/09/1296x728_Holy_Basil-1200x628.jpg", description: "Tulsi is known in folk medicine for boosting immunity and overall wellness.", stock: 60, featured: true },
        { id: 6, name: "Lemon Grass", category: "medicinal", price: 20, image: "https://www.gardeningknowhow.com/wp-content/uploads/2021/07/lemongrass.jpg", description: "Lemon Grass is widely used for its calming aroma, digestion support, and anti-inflammatory effects.", stock: 35, featured: false },
        { id: 7, name: "Mint", category: "medicinal", price: 20, image: "https://www.thespruce.com/thmb/lKP125c_ErVh6bieH0ZdsZBqe58=/5019x3346/filters:no_upscale():max_bytes(150000):strip_icc()/leaves-on-a-mint-plant--lamiaceae---close-up-187591758-5954131c5f9b5815d91d5517.jpg", description: "Mint is refreshing, supports digestion, and is widely used in food and herbal medicine.", stock: 40, featured: true },
        { id: 8, name: "Curry Leaves", category: "medicinal", price: 20, image: "https://theaffordableorganicstore.com/cdn/shop/files/Curry-Leaves-Sapling-1.webp?v=1744629678", description: "Curry Leaves are rich in antioxidants and widely used for hair, skin, and digestive health.", stock: 45, featured: false },
        { id: 9, name: "Aloe Vera", category: "medicinal", price: 30, image: "https://5.imimg.com/data5/SELLER/Default/2023/12/367446995/XM/LF/DU/204373317/aloe-vera-plant-1000x1000.jpg", description: "Aloe Vera is known for its healing properties and skincare benefits.", stock: 55, featured: true },
        { id: 10, name: "Touch Me Not", category: "medicinal", price: 25, image: "https://tse2.mm.bing.net/th/id/OIP.k2OrhZA2iZJ10cHOE8RyqwHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Touch Me Not (Mimosa pudica) is valued for its wound healing and anti-inflammatory properties.", stock: 30, featured: false },
        { id: 11, name: "Curry Leaves", category: "medicinal", price: 20, image: "https://theaffordableorganicstore.com/cdn/shop/files/Curry-Leaves-Sapling-1.webp?v=1744629678", description: "Curry Leaves are rich in antioxidants and widely used for hair, skin, and digestive health.", stock: 45, featured: false },
        { id: 12, name: "Tulsi", category: "medicinal", price: 20, image: "https://media.post.rvohealth.io/wp-content/uploads/2020/09/1296x728_Holy_Basil-1200x628.jpg", description: "Tulsi is known in folk medicine for boosting immunity and overall wellness.", stock: 60, featured: true },
        { id: 13, name: "Magai Paan", category: "medicinal", price: 20, image: "https://plantsden.com/cdn/shop/products/beetel-leaf-500x500.jpg?v=1675328994", description: "Magai Paan leaves are used for digestion and are culturally significant in India.", stock: 25, featured: false },
        { id: 14, name: "Long Pepper", category: "medicinal", price: 20, image: "https://tse3.mm.bing.net/th/id/OIP.yAxJVTlVI3BPJGb558qUKgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Long Pepper is used in Ayurveda for respiratory issues, digestion, and boosting metabolism.", stock: 20, featured: false },
        { id: 15, name: "Black Pepper", category: "medicinal", price: 20, image: "https://balconygardenweb.b-cdn.net/wp-content/uploads/2020/04/How-to-Grow-Black-Pepper-Plant.jpg", description: "Black Pepper is a common spice with medicinal properties aiding digestion and immunity.", stock: 30, featured: false },
        { id: 16, name: "Gulvel", category: "medicinal", price: 20, image: "https://www.iafaforallergy.com/wp-content/uploads/2023/11/Guduci-Tinospora-cordifolia.webp", description: "Gulvel (Giloy) is highly regarded in Ayurveda for immunity boosting and detoxification.", stock: 35, featured: true },
        { id: 17, name: "Aghada", category: "medicinal", price: 20, image: "https://media.assettype.com/agrowon/2024-07/f699374e-df70-4610-a483-b3edffb636b2/7.jpg", description: "Aghada is used in traditional remedies for cough, cold, and skin ailments.", stock: 25, featured: false },
        { id: 18, name: "Insulin Plant", category: "medicinal", price: 25, image: "https://m.media-amazon.com/images/I/513OnsahqyL._UF1000,1000_QL80_.jpg", description: "Insulin Plant is known for managing blood sugar levels naturally.", stock: 20, featured: true },
        { id: 19, name: "Khuskus", category: "medicinal", price: 25, image: "https://plantsguru.com/cdn/shop/files/pg-khus-plant.jpg?v=1735618432&width=3000", description: "Khuskus is valued for its cooling properties and is used in traditional drinks and remedies.", stock: 15, featured: false },
        { id: 20, name: "Damaki Vel", category: "medicinal", price: 25, image: "https://nurserylive.com/cdn/shop/products/nurserylive-sankrant-vel-flame-vine-plant-2_525x700.jpg?v=1634227996", description: "Dhamaki Vel is used in Ayurveda for treating asthma and respiratory conditions.", stock: 18, featured: false },
        { id: 21, name: "Mint", category: "medicinal", price: 20, image: "https://www.thespruce.com/thmb/lKP125c_ErVh6bieH0ZdsZBqe58=/5019x3346/filters:no_upscale():max_bytes(150000):strip_icc()/leaves-on-a-mint-plant--lamiaceae---close-up-187591758-5954131c5f9b5815d91d5517.jpg", description: "Mint is refreshing, supports digestion, and is widely used in food and herbal medicine.", stock: 40, featured: true },
        { id: 22, name: "Gunj", category: "medicinal", price: 25, image: "https://i.pinimg.com/originals/f6/7f/46/f67f46ef9af04a81124ef7e41511d9b7.jpg", description: "Gunj (Abrus precatorius) is traditionally used for joint pain and skin conditions.", stock: 20, featured: false },
        { id: 23, name: "Mayalu", category: "medicinal", price: 20, image: "https://timergarden.com/cdn/shop/files/5_e38f1fea-1f20-4c1d-ae78-f48c49d66d71_1500x.jpg?v=1707213527", description: "Mayalu is used for digestive support and in some traditional health remedies.", stock: 25, featured: false },
        { id: 24, name: "Bhringraj", category: "medicinal", price: 20, image: "https://trustherb.com/wp-content/uploads/2021/07/bhringraj-768x576.jpg", description: "Bhringraj is famous for promoting hair growth and liver health.", stock: 30, featured: false },
        { id: 25, name: "Chitrak", category: "medicinal", price: 20, image: "https://www.ayurhelp.com/wp-content/uploads/2023/02/chitraka.jpg", description: "Chitrak is known in Ayurveda for improving digestion and metabolism.", stock: 25, featured: false },
        { id: 26, name: "Garlic Creeper", category: "medicinal", price: 20, image: "https://efloraofindia.com/wp-content/uploads/2020/10/DSCN3045-2.JPG", description: "Garlic Creeper is a climber plant valued for its anti-inflammatory and joint pain relief benefits.", stock: 20, featured: false },
        { id: 27, name: "Madar", category: "medicinal", price: 25, image: "https://thumbs.dreamstime.com/b/closeup-shot-madar-plant-flowers-aak-aakado-background-blur-selective-focus-subject-233556132.jpg", description: "Madar (Calotropis) is used in Ayurveda for skin diseases and digestive issues.", stock: 15, featured: false },
        { id: 28, name: "Agnimantha", category: "medicinal", price: 20, image: "https://m.media-amazon.com/images/I/41VVqi1pD5L.jpg", description: "Agnimantha is used in Dashmool formulations, helpful for inflammation and pain relief.", stock: 25, featured: false },
        { id: 29, name: "Ram Tulsi", category: "medicinal", price: 20, image: "https://dukaan.b-cdn.net/700x700/webp/media/a18ca32b-b4dc-4d3f-bab6-74363a4e18ff.png", description: "Ram Tulsi is considered sacred and is used in remedies for cough, cold, and fever.", stock: 30, featured: false },
        { id: 30, name: "East-Indian Screw Tree", category: "medicinal", price: 20, image: "https://m.media-amazon.com/images/I/71GFIHt517L._SX425_.jpg", description: "East-Indian Screw Tree is valued for treating digestive disorders and respiratory issues.", stock: 20, featured: false },
                    
        // Flowering Plants
        { id: 31, name: "Sadaphuli", category: "flower", price: 20, image: "https://cdn.mos.cms.futurecdn.net/YVHbF9xrUUM9cmDWWFtzt4.jpg", description: "Sadaphuli (Periwinkle) is an ornamental flower with medicinal properties, used for diabetes and blood pressure control.", stock: 40, featured: true },
        { id: 32, name: "Gokarn", category: "flower", price: 20, image: "https://www.yoidentity.com/wp-content/uploads/2020/07/Yoidentity-Clitoria-Ternatea-Gokarna-Aparajita-Blue-Plant.jpg", description: "Gokarn (Butterfly Pea) is valued for its beautiful blue flowers and memory-enhancing benefits.", stock: 35, featured: false },
        { id: 33, name: "Gurmar", category: "flower", price: 25, image: "https://www.planetayurveda.com/wp-content/uploads/2019/04/Gurmar-Plant-Images-Madhunashini-plant-images.jpg", description: "Gurmar is traditionally used in Ayurveda to manage blood sugar levels and improve digestion.", stock: 20, featured: false },
        { id: 34, name: "Jaswand", category: "flower", price: 20, image: "https://4.imimg.com/data4/NW/QV/MY-29793251/red-jaswand-flower-plant-500x500.jpg", description: "Jaswand (Hibiscus) is used for hair growth, skincare, and as a natural cooling drink.", stock: 50, featured: true },
        { id: 35, name: "Jui", category: "flower", price: 20, image: "https://plantsguru.com/cdn/shop/files/Jui_Plant_Juhi_Jasminum_auriculatum.jpg?v=1746038852&width=1100", description: "Jui (Jasmine) is admired for its fragrance and is used in perfumes and calming herbal teas.", stock: 45, featured: true },
        { id: 36, name: "Jaai", category: "flower", price: 20, image: "https://i.pinimg.com/736x/73/81/c6/7381c6b078e7a0e183b782ac4764efc9.jpg", description: "Jaai (Arabian Jasmine) is popular for garlands and religious offerings, known for its soothing aroma.", stock: 30, featured: false },
        { id: 37, name: "Mogara", category: "flower", price: 20, image: "https://m.media-amazon.com/images/I/61AgfokwE6L._SL1024_.jpg", description: "Mogara (Jasmine variety) is cherished for its intoxicating fragrance and is widely grown as an ornamental plant.", stock: 35, featured: false },
        { id: 38, name: "Kamini", category: "flower", price: 20, image: "https://www.toothmountainnursery.com/wp-content/uploads/2020/02/Kamini-700x700.jpg", description: "Kamini is a fragrant flowering plant often used in hedges and traditional perfumes.", stock: 28, featured: false },
        { id: 39, name: "Rangoon Creeper", category: "flower", price: 20, image: "https://greenkosh.com/wp-content/uploads/2019/09/Rangoon-Creeper.jpg", description: "Rangoon Creeper produces fragrant flowers that change color and is used in traditional medicine.", stock: 22, featured: false },
        { id: 40, name: "Tagar", category: "flower", price: 20, image: "https://cdn.shopclues.com/images1/detailed/113174/151981219-113174672-1612970706.jpg", description: "Tagar (Crape Jasmine) is grown for its decorative white flowers and medicinal uses for skin and pain relief.", stock: 27, featured: false },
        { id: 41, name: "Chameli", category: "flower", price: 20, image: "https://lh6.googleusercontent.com/4liWkdAE_lRGp6LkgL1v_GANY9l28CXrefVelyrxP487pF2avqrDusY78t2Eg1jj5RkT6IiKEf3lgbdm5FI-pCyoSZhJO20cDUbjGO8zLKGlCgRoTAYEvBvlo1hIk3b0nfgHNN0K_la-4joZWg", description: "Chameli is a fragrant jasmine variety used in oils, perfumes, and Ayurvedic treatments.", stock: 33, featured: false },
        { id: 42, name: "Aboli", category: "flower", price: 20, image: "https://vanitascorner.com/wp-content/uploads/2020/05/Aboli-3.jpg", description: "Aboli (Crossandra) is a bright orange flower commonly used in garlands and decoration.", stock: 38, featured: false },
        { id: 43, name: "Chini Gulab", category: "flower", price: 20, image: "https://i.pinimg.com/originals/c0/75/39/c0753907b3d1a5229dc7074e9bba49f1.jpg", description: "Chini Gulab (Chinese Rose) is popular in gardens and used in skincare and perfumes.", stock: 42, featured: false },
        { id: 44, name: "Raatrani", category: "flower", price: 20, image: "https://nurserynisarga.in/wp-content/uploads/2019/03/Untitled-design-2023-08-23T113041.860.webp", description: "Raatrani (Night-blooming Jasmine) blooms at night and fills the air with a strong fragrance.", stock: 29, featured: false },
        { id: 45, name: "Gulbakshi", category: "flower", price: 20, image: "https://i.pinimg.com/originals/c5/75/e1/c575e108bb5b6211f7272eeb56bad66b.jpg", description: "Gulbakshi (Four O'Clock Flower) opens in the evening and comes in bright colors.", stock: 31, featured: false },
        { id: 46, name: "Lily", category: "flower", price: 20, image: "https://tse2.mm.bing.net/th/id/OIP.-MKJmfaimUIPirT-3OC3AgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Lily flowers are elegant, fragrant, and often used in religious ceremonies and decorations.", stock: 26, featured: false },
        { id: 47, name: "Zendu", category: "flower", price: 20, image: "https://thumbs.dreamstime.com/b/flowers-indian-called-his-zendu-phool-flowers-indian-called-his-zendu-phool-164610548.jpg", description: "Zendu (Marigold) is widely used in festivals, garlands, and traditional medicines.", stock: 48, featured: false },
        { id: 48, name: "Chapha", category: "flower", price: 30, image: "https://cdn.pixabay.com/photo/2015/07/02/17/23/plumeria-829326_1280.jpg", description: "Chapha (Plumeria) is a fragrant flower often used in worship and decoration.", stock: 24, featured: false },
        { id: 49, name: "Terada", category: "flower", price: 20, image: "https://thumbs.dreamstime.com/b/pink-tiny-elegant-terada-flowers-terda-impatiens-lasamina-tomentosa-kas-pathar-satara-maharashtra-india-258943421.jpg", description: "Terada is a traditional flowering plant admired for its ornamental value.", stock: 19, featured: false },
        { id: 50, name: "Ganeshvel", category: "flower", price: 20, image: "https://mybageecha.com/cdn/shop/products/cyprus_vine_Ganesh_Bel.JPG?v=1571438579", description: "Ganeshvel is a flowering climber plant, often grown for its beauty and cultural significance.", stock: 23, featured: false },
        
        // Ornamental Plants (IDs 51-85)
        { id: 51, name: "Cuphea", category: "ornamental", price: 20, image: "https://farm4.staticflickr.com/3198/3090919131_6096bd4561_o_d.jpg", description: "Cuphea is a small ornamental plant with bright flowers.", stock: 30, featured: false },
        { id: 52, name: "Agave", category: "ornamental", price: 25, image: "https://tse4.mm.bing.net/th/id/OIP.lBu8lfnbdSwiEDlt9Lnl2QHaJu?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Agave is a succulent plant known for its rosette shape.", stock: 25, featured: false },
        { id: 53, name: "Laalmaath", category: "ornamental", price: 20, image: "https://th.bing.com/th/id/R.e2ceb5dcac429ddeb66f8e3af131af8e?rik=0OvcvwpGqh5z0A&riu=http%3a%2f%2fseedandplant.com%2fcdn%2fshop%2ffiles%2fLaal_Saag-Leafy-Vegetable_Seed-_Open_Pollinated.jpg%3fv%3d1687977597&ehk=ZhZ%2fGmj9k0fqjrSuDS2NNxhkvXEwWeObS7d3RXPDXQQ%3d&risl=&pid=ImgRaw&r=0", description: "Laalmaath is an ornamental plant with reddish foliage.", stock: 35, featured: false },
        { id: 54, name: "Aralia", category: "ornamental", price: 20, image: "https://img.crocdn.co.uk/images/products2/pl/20/00/03/08/pl2000030879.jpg?width=940&height=940", description: "Aralia is a decorative plant often grown indoors.", stock: 40, featured: false },
        { id: 55, name: "Bamboo", category: "ornamental", price: 50, image: "https://i.pinimg.com/originals/6c/85/53/6c85531f3f6787495869ef2a733eff52.jpg", description: "Bamboo is a fast-growing plant symbolizing strength and flexibility.", stock: 20, featured: true },
        { id: 56, name: "Golden Bamboo", category: "ornamental", price: 50, image: "https://5.imimg.com/data5/SELLER/Default/2024/9/451573912/FH/MQ/TV/151548506/golden-bamboo-plants-500x500.jpg", description: "Golden Bamboo has a yellowish stem and is ideal for landscaping.", stock: 18, featured: false },
        { id: 57, name: "Bougainvillea", category: "ornamental", price: 20, image: "https://th.bing.com/th/id/R.1655faf894a108375a947baac5995dac?rik=6wc7De0%2brLVZ%2fQ&riu=http%3a%2f%2f3.bp.blogspot.com%2f-RM-BN30_VUg%2fTYq0CReJaHI%2fAAAAAAAAEog%2f6ozoyvDOQ54%2fs1600%2fBougainvillea%252B%25257E%252B02-788863.jpg&ehk=GHlyp0ewFTfq8Dmi%2bumRcSdA7ac1xdoYv0%2bgAwO2tQw%3d&risl=&pid=ImgRaw&r=0", description: "Bougainvillea is a colorful climbing plant perfect for fences.", stock: 25, featured: false },
        { id: 58, name: "Palm", category: "ornamental", price: 30, image: "https://tse3.mm.bing.net/th/id/OIP.Yr6SVs2ItkaOSr1WtS-TkAHaHa?r=0&w=960&h=960&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Palm trees are ornamental plants that give a tropical vibe.", stock: 15, featured: false },
        { id: 59, name: "Croton", category: "ornamental", price: 20, image: "https://www.gardeningknowhow.com/wp-content/uploads/2017/05/croton-garden.jpg", description: "Croton is known for its colorful and patterned leaves.", stock: 30, featured: false },
        { id: 60, name: "Dieffenbachia", category: "ornamental", price: 20, image: "https://www.planetnatural.com/wp-content/uploads/2023/09/Dieffenbachia.jpg", description: "Dieffenbachia is a popular indoor plant with variegated leaves.", stock: 28, featured: false },
        { id: 61, name: "Dracaena", category: "ornamental", price: 20, image: "https://hgtvhome.sndimg.com/content/dam/images/hgtv/products/2020/3/20/1/rx_amazon_dracaena-lemon-lime.jpeg.rend.hgtvcom.1280.1280.suffix/1584714804856.jpeg", description: "Dracaena is a low-maintenance plant that purifies air.", stock: 32, featured: false },
        { id: 62, name: "Money Plant", category: "ornamental", price: 20, image: "https://tse1.mm.bing.net/th/id/OIP.gG7TgRr776kut5q-G_wlcgHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Money Plant is believed to bring prosperity and positive energy.", stock: 40, featured: true },
        { id: 63, "name": "Ixora", "category": "ornamental", "price": 20, "image": "https://tse1.mm.bing.net/th/id/OIP.zODg4FXvcuNSC2f6yjZ8PQHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", "description": "Ixora produces clusters of bright flowers used in gardens.", stock: 35, featured: false },
        { id: 64, "name": "Pentas", "category": "ornamental", "price": 20, "image": "https://tse3.mm.bing.net/th/id/OIP.DLo18ClNZBDGA5kum-PtEQHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", "description": "Pentas are star-shaped flowers that attract butterflies.", stock: 20, featured: false },
        { id: 65, "name": "Lantana", "category": "ornamental", "price": 20, "image": "https://www.gardeningknowhow.com/wp-content/uploads/2021/07/pink-and-yellow-lantana-flowers-1536x1152.jpg", "description": "Lantana is a hardy shrub with colorful blooms.", stock: 25, featured: false },
        { id: 66, "name": "Mussaenda", "category": "ornamental", "price": 25, "image": "https://alchetron.com/cdn/mussaenda-dc47f913-b5fe-4ee6-8caf-35f8c76de2f-resize-750.jpeg", "description": "Mussaenda is grown for its large, colorful bracts.", stock: 15, featured: false },
        { id: 67, "name": "Pandanus", "category": "ornamental", "price": 20, "image": "https://img1.etsystatic.com/104/0/11096495/il_570xN.1039095767_o1lv.jpg", "description": "Pandanus is a spiky-leaved plant often used for hedges.", stock: 22, featured: false },
        { id: 68, "name": "Philodendron", "category": "ornamental", "price": 25, "image": "https://plantphilo.com/wp-content/uploads/2024/07/Best-Soil-Philodendrons.jpg", "description": "Philodendron is a popular indoor plant with large green leaves.", stock: 18, featured: false },
        { id: 69, "name": "Ribbon grass", "category": "ornamental", "price": 25, "image": "https://tse3.mm.bing.net/th/id/OIP.SP_uHSWLzNx5kOMYjOVcmgHaHa?r=0&w=600&h=600&rs=1&pid=ImgDetMain&o=7&rm=3", "description": "Ribbon grass is a striped ornamental grass for landscaping.", stock: 30, featured: false },
        { id: 70, "name": "Fern", "category": "ornamental", "price": 20, "image": "https://www.southernliving.com/thmb/9xe_bUwg_gJ1leAk8UZxtpAO2IM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/gettyimages-1026378744-1-8e6bdd98366d4686b765313800f32f52.jpg", "description": "Fern is a lush green plant ideal for shaded areas.", stock: 40, featured: false },
        { id: 71, "name": "Coleus", "category": "ornamental", "price": 20, "image": "https://m.media-amazon.com/images/I/81zJvU5F47L._AC_SL1500_.jpg", "description": "Coleus is valued for its colorful patterned foliage.", stock: 35, featured: false },
        { id: 72, "name": "Syngonium", "category": "ornamental", "price": 20, "image": "https://nestreeo.com/wp-content/uploads/2019/09/Syngonium-Big-Leaf-2.jpg", "description": "Syngonium is a low-maintenance indoor plant with arrow-shaped leaves.", stock: 28, featured: false },
        { id: 73, "name": "Sansevieria", "category": "ornamental", "price": 20, "image": "https://m.media-amazon.com/images/I/818CAvsi6-L.jpg", "description": "Sansevieria (Snake Plant) is an excellent air purifier.", stock: 30, featured: true },
        { id: 74, "name": "Pilea", "category": "ornamental", "price": 20, "image": "https://cdn.makemygarden.com/uploads/2021/08/192.jpg", "description": "Pilea is a trendy houseplant with coin-shaped leaves.", stock: 22, featured: false },
        { id: 75, "name": "Jamaican Bluespike", "category": "ornamental", "price": 20, "image": "https://tse2.mm.bing.net/th/id/OIP.LYH5Uhz6z2qFc-hLJv0e4wHaF4?r=0&w=680&h=540&rs=1&pid=ImgDetMain&o=7&rm=3", "description": "Jamaican Bluespike is an ornamental plant with blue flowers.", stock: 15, featured: false },
        { id: 76, "name": "Climbing Fig", "category": "ornamental", "price": 20, "image": "https://i.pinimg.com/originals/45/3a/4a/453a4aff2874136d372eaf2a67b2ff9a.jpg", "description": "Climbing Fig is a fast-growing creeper ideal for walls.", stock: 20, featured: false },
        { id: 77, "name": "Rhoeo", "category": "ornamental", "price": 20, "image": "https://i.pinimg.com/originals/7f/90/94/7f90942ddb80c86b5e05d49aa94f25f3.jpg", "description": "Rhoeo is an ornamental plant with purple-tinted leaves.", stock: 25, featured: false },
        { id: 78, "name": "Foxtail fern", "category": "ornamental", "price": 20, "image": "https://indoorplantcenter.com/wp-content/uploads/2021/12/Foxtail-Fern.jpg", "description": "Foxtail fern has lush green fronds that look like foxtails.", stock: 30, featured: false },
        { id: 79, "name": "Maranta", "category": "ornamental", "price": 20, "image": "https://images.immediate.co.uk/production/volatile/sites/10/2021/02/2048x1365-Maranta-SEO-GettyImages-1248988991-6ed2ea4.jpg?quality=90&resize=960%2C640", "description": "Maranta (Prayer Plant) has beautiful patterned leaves.", stock: 20, featured: false },
        { id: 80, "name": "Heliconia", "category": "ornamental", "price": 20, "image": "https://cdn.mos.cms.futurecdn.net/S5D5LJSgURdYx9XqvpKrSi-1200-80.jpg", "description": "Heliconia is known for its striking, colorful bracts.", stock: 18, featured: false },
        { id: 81, "name": "Knotted Jatropha", "category": "ornamental", "price": 30, "image": "https://tse3.mm.bing.net/th/id/OIP.KiOiGOHGIMbH4mkz_axbyQHaFj?r=0&w=2048&h=1536&rs=1&pid=ImgDetMain&o=7&rm=3", "description": "Knotted Jatropha is an ornamental shrub with bright flowers.", stock: 12, featured: false },
        { id: 82, "name": "Wild Pudina", "category": "ornamental", "price": 15, "image": "https://m.media-amazon.com/images/I/51km8dzcygL.jpg", "description": "Wild Pudina has aromatic leaves used in cooking and medicine.", stock: 40, featured: false },
        { id: 83, "name": "Peacock Flower", "category": "ornamental", "price": 20, "image": "https://plantsbazar.com/media/catalog/product/cache/1/thumbnail/800x/221956c5889d06f3e386d4083fb81582/r/a/radhachura-or-peacock-flower.jpg", "description": "Peacock Flower is known for its vibrant and feathery blossoms.", stock: 25, featured: false },
        { id: 84, "name": "Shankeshwari", "category": "ornamental", "price": 20, "image": "https://i.ytimg.com/vi/4T-tmylvAB4/oar2.jpg?sqp=-oaymwEYCJUDENAFSFqQAgHyq4qpAwcIARUAAIhC&rs=AOn4CLA-HDjHy0tujozqb-t3FyWt7VWAyA", "description": "Shankeshwari is an ornamental plant with lush foliage.", stock: 20, featured: false },
        { id: 85, "name": "Krishnakamal", "category": "ornamental", "price": 20, "image": "https://indiagardening.b-cdn.net/wp-content/uploads/2020/01/1Krishna-Kamal-Plant.jpg", "description": "Krishnakamal (Passion Flower) has unique and striking blossoms.", stock: 15, featured: false },
        
        // Tree (IDs 86-122)
        { id: 86, name: "Bel", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/41Nn89jB97L.jpg", description: "Bel tree (Aegle marmelos) valued for its medicinal fruits and religious use.", stock: 15, featured: false },
        { id: 87, name: "Kanchan", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/61FkL-t4wxL.jpg", description: "Kanchan (Bauhinia) is a flowering tree known for its beautiful blossoms.", stock: 12, featured: false },
        { id: 88, name: "Aapata", category: "tree", price: 20, image: "https://www.agrifarming.in/wp-content/uploads/2018/10/Sapota-Plant..jpg", description: "Aapata is traditionally associated with rituals and local festivals.", stock: 10, featured: false },
        { id: 89, name: "Katesavar", category: "tree", price: 20, image: "https://tse1.mm.bing.net/th/id/OIP.v-QhyWXEmSS9dtBZuZfD7wAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Katesavar is a hardy common tree found in rural landscapes.", stock: 8, featured: false },
        { id: 90, name: "Palas", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/61iK0pCIIzL._SL1016_.jpg", description: "Palas (Flame of the Forest) is famous for bright orange flowers.", stock: 15, featured: false },
        { id: 91, name: "Gulmohar", category: "tree", price: 20, image: "https://tse3.mm.bing.net/th/id/OIP.ztbRF4gHRI_TlnJFgR9RRwHaHe?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Gulmohar is an ornamental tree known for vibrant red/orange flowers.", stock: 18, featured: false },
        { id: 92, name: "Sher", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/81eu4P6LuxL._AC_SL1500_.jpg", description: "Sher is a locally known tree species with cultural importance.", stock: 10, featured: false },
        { id: 93, name: "Payar", category: "tree", price: 30, image: "https://i.etsystatic.com/21996357/c/667/667/247/0/il/cbe2ff/4321474925/il_600x600.4321474925_1w1v.jpg", description: "Payar is planted for shade and general greenery.", stock: 12, featured: false },
        { id: 94, name: "Vad (Banyan)", category: "tree", price: 30, image: "https://nurserynisarga.in/wp-content/uploads/2022/05/pla.webp", description: "Vad (Banyan) is sacred and provides a dense shady canopy.", stock: 5, featured: true },
        { id: 95, name: "Umbar (Fig)", category: "tree", price: 30, image: "https://images.squarespace-cdn.com/content/v1/61705bd42945b34331c1718d/1638520577194-M4CE3M4RM9CRFW878N0U/image-asset.jpeg?format=750w", description: "Umbar bears edible figs and supports local wildlife.", stock: 7, featured: false },
        { id: 96, name: "Pimpal (Peepal)", category: "tree", price: 30, image: "https://tse4.mm.bing.net/th/id/OIP.bXwAaTyHmEAy4C5V3IfH4gHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Pimpal is revered and known for its broad canopy.", stock: 6, featured: true },
        { id: 97, name: "Mehandi (Henna)", category: "tree", price: 20, image: "https://www.plantshop.me/media/product/Henna_Plant_Seeds_-_plantshopme.jpg", description: "Mehandi cultivated for leaves used in dye and cosmetics.", stock: 20, featured: false },
        { id: 98, name: "Mango", category: "tree", price: 30, image: "https://media.30seconds.com/tip/lg/How-to-Grow-a-Mango-Plant-From-Seed-Plus-Growing-Tips-So-I-58440-1a797b5f49-1682630452.jpg", description: "Mango is a popular fruit-bearing tree grown widely.", stock: 10, featured: true },
        { id: 99, name: "Nagkesar", category: "tree", price: 30, image: "https://lalitenterprise.com/cdn/shop/files/Premna_japonica.webp?v=1721386089&width=1445", description: "Nagkesar known for fragrant flowers and medicinal uses.", stock: 8, featured: false },
        { id: 100, name: "Bakul", category: "tree", price: 25, image: "https://toptropicals.com/pics/garden/05/7/7634.jpg", description: "Bakul has sweet-smelling flowers often used in garlands.", stock: 15, featured: false },
        { id: 101, name: "Tuti (Mulberry)", category: "tree", price: 20, image: "https://dukaan.b-cdn.net/700x700/webp/media/5e5e2fb2-c027-4a6f-8eab-438737639dcf.png", description: "Tuti (mulberry) valued for its fruit and leaves.", stock: 18, featured: false },
        { id: 102, name: "Kadamb", category: "tree", price: 25, image: "https://img.staticmb.com/mbcontent/images/crop/uploads/2023/10/Kadam_Feature_0_1200.jpg", description: "Kadamb has fragrant flowers and mythological associations.", stock: 10, featured: false },
        { id: 103, name: "Parijatak", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/61isyebrHwL._SL1300_.jpg", description: "Parijatak (Nyctanthes) produces fragrant night-blooming flowers.", stock: 12, featured: false },
        { id: 104, name: "Ashok", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/91Ek2hlBNZL._SL1500_.jpg", description: "Ashok is known for attractive foliage and medicinal bark.", stock: 15, featured: false },
        { id: 105, name: "Karanj", category: "tree", price: 20, image: "https://www.feedipedia.org/sites/default/files/images/karanja_leaves_flowers.jpg", description: "Karanj (Pongamia) used for shade; seeds yield oil.", stock: 10, featured: false },
        { id: 106, name: "Putranjiva", category: "tree", price: 20, image: "https://ik.imagekit.io/4r1osr2bj/imagekit-digitaloceanbucket/static/flora_title/Euphorbiaceae_Putranjiva%20roxburghii_1_Title1.jpg", description: "Putranjiva is an evergreen ornamental often used as a hedge.", stock: 12, featured: false },
        { id: 107, name: "Sita Ashok", category: "tree", price: 30, image: "https://live.staticflickr.com/2685/4372253927_8e02eb0415_b.jpg", description: "Sita Ashok is ornamental with graceful drooping branches.", stock: 8, featured: false },
        { id: 108, name: "Arjun", category: "tree", price: 25, image: "https://5.imimg.com/data5/SELLER/Default/2020/9/AX/BF/LK/35988233/arjuna-plant-500x500.jpg", description: "Arjun bark is used in Ayurveda for heart-related remedies.", stock: 10, featured: false },
        { id: 109, name: "Moha", category: "tree", price: 25, image: "https://th.bing.com/th/id/R.4acae15d292f4f24ff6af7a8689b7b8b?rik=InQ25jxSJuotvA&riu=http%3a%2f%2fnourishyou.in%2fcdn%2fshop%2farticles%2fmilletsbanner_1200x1200.png%3fv%3d1675861124&ehk=VgKA1WxLABJxNMCPogkLaZxmCPV1rl%2bRaVy5rtIFS5k%3d&risl=&pid=ImgRaw&r=0", description: "Moha (Mahua) yields edible flowers and seeds used for oil.", stock: 7, featured: false },
        { id: 110, name: "Samudraphal", category: "tree", price: 20, image: "https://tse3.mm.bing.net/th/id/OIP.yK0USe6a0j1xvEPXWVcHsQAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Samudraphal is grown for ornamental and local medicinal value.", stock: 10, featured: false },
        { id: 111, name: "Wild Badam", category: "tree", price: 20, image: "https://i.pinimg.com/originals/70/cf/12/70cf128faffeb2220298991be2e29f97.jpg", description: "Wild Badam is a shade tree with edible seeds.", stock: 15, featured: false },
        { id: 112, name: "Ratangunj", category: "tree", price: 20, image: "https://naturere.org/wp-content/uploads/2024/07/Ratangunj.jpg", description: "Ratangunj is ornamental with bright colored seeds or fruit.", stock: 10, featured: false },
        { id: 113, name: "Asana", category: "tree", price: 20, image: "https://live.staticflickr.com/1333/817738076_a6d3723072_b.jpg", description: "Asana is a timber tree valued for strong, durable wood.", stock: 8, featured: false },
        { id: 114, name: "Barbados cherry", category: "tree", price: 20, image: "https://tse4.mm.bing.net/th/id/OIP.aEAIW1fEQXcYb4TsUwVc1AHaJt?r=0&w=1080&h=1416&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Barbados cherry yields vitamin-C rich fruits.", stock: 12, featured: false },
        { id: 115, name: "Medshingi", category: "tree", price: 20, image: "https://th.bing.com/th/id/R.6e41c616987a220e3ffb41caa9defdc4?rik=%2fPfEmPhQW1MNoA&riu=http%3a%2f%2fcdn.shopify.com%2fs%2ffiles%2f1%2f0648%2f2559%2f0002%2farticles%2fMEDHASHINGHI.jpg%3fv%3d1667985888&ehk=EF7Lh8%2bqoQIvPAmdcqOp4vnSqgIgafGGs2xbuqSbHYU%3d&risl=&pid=ImgRaw&r=0", description: "Medshingi is a medicinal tree with thorny branches.", stock: 10, featured: false },
        { id: 116, name: "Jamun", category: "tree", price: 20, image: "https://tse2.mm.bing.net/th/id/OIP.o0TeSjy0dsPfqu2l0bX9NQAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Jamun produces nutritious purple fruits with health benefits.", stock: 15, featured: false },
        { id: 117, name: "Tamarind", category: "tree", price: 20, image: "https://vitalveda.com.au/wp-content/uploads/2022/07/48259768186_375f0086ed_b.jpg", description: "Tamarind tree produces tangy pods used widely in cooking.", stock: 10, featured: false },
        { id: 118, name: "Kinjal", category: "tree", price: 20, image: "https://storage.googleapis.com/powop-assets/neotropikey/casuarinaceae_fullsize.jpg", description: "Kinjal is a native shade tree used in local landscaping.", stock: 8, featured: false },
        { id: 119, name: "Kailaspati", category: "tree", price: 20, image: "https://tse3.mm.bing.net/th/id/OIP.zdJWkJMVIf-5z6VFWF20PAAAAA?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Kailaspati is a large tree notable for its distinctive flowers.", stock: 7, featured: false },
        { id: 120, name: "Soap Nut Tree", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/71IWuImYQZL._SL1000_.jpg", description: "Soap Nut tree produces fruits used as natural soap.", stock: 12, featured: false },
        { id: 121, name: "Tembhurni", category: "tree", price: 20, image: "https://live.staticflickr.com/7054/6789625696_4f10d90583_b.jpg", description: "Tembhurni is commonly used for timber and shade.", stock: 10, featured: false },
        { id: 122, name: "Jatropha", category: "tree", price: 20, image: "https://bs.plantnet.org/image/o/9b9fec39f5d6ef5fe988cbb7669b3e446db04fdc", description: "Jatropha grown for seeds that are processed into biofuel.", stock: 15, featured: false },

        // Fruit Tree (IDs 123-125)
        { id: 123, name: "Papaya", category: "fruit trees", price: 20, image: "https://cdn.britannica.com/49/183449-050-1A2B4250/Papaya-tree.jpg", description: "Papaya produces nutritious fruits rich in vitamins.", stock: 25, featured: false },
        { id: 124, name: "Lemon", category: "fruit trees", price: 30, image: "https://www.thetreecenter.com/wp-content/uploads/meyer-lemon-tree-full-grown.jpg", description: "Lemon tree cultivated for sour, vitamin-rich fruits.", stock: 20, featured: true },
        { id: 125, name: "Drum Stick (Moringa)", category: "fruit trees", price: 30, image: "https://mygreenleaf.ae/wp-content/uploads/2024/01/moringa-tree.jpg", description: "Drum Stick tree (Moringa) grown for edible pods and nutritious leaves.", stock: 15, featured: true },

        // Live Fences (IDs 126-129)
        { id: 126, name: "Nivadung", category: "live fences", price: 20, image: "https://c8.alamy.com/comp/F3GTNG/cactus-local-name-fadya-nivdung-district-sindhudurga-maharashtra-india-F3GTNG.jpg", description: "Nivadung used as a natural, thorny live fence.", stock: 30, featured: false },
        { id: 127, name: "Duranta", category: "live fences", price: 20, image: "https://www.thespruce.com/thmb/t2vJyU3CYPk2oENN3j3M1AlY84M=/2119x1414/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1130897014-d59bdd987c7241d7ba4eb1d84ed35976.jpg", description: "Duranta is a flowering shrub ideal for hedges and fencing.", stock: 35, featured: false },
        { id: 128, name: "Pedilanthus", category: "live fences", price: 20, image: "https://planetdesert.com/cdn/shop/files/Pedialanthus-Bracteatus-1-Gallon_4_1800x1800.jpg?v=1715582250", description: "Pedilanthus is a decorative border plant used in live fences.", stock: 28, featured: false },
        { id: 129, name: "Vitex", category: "live fences", price: 20, image: "https://www.gardencrossings.com/wp-content/uploads/2023/12/vitex_rock_steady_chasetree_gc_vitrs_01.jpg", description: "Vitex is a medicinal/ornamental plant often used as a hedge.", stock: 22, featured: false }
    ];
    saveData(PLANTS_FILE, plants); // Save the default plants to file
}


// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); // Assuming your frontend is in a 'public' folder

// Critical middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins for development, restrict in production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Handle preflight requests
app.options('*', cors());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] - ${req.method} ${req.url}`);
    next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Auth routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, email, password' });
        }
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: uuid(),
            name,
            email,
            password: hashedPassword,
            isAdmin: false,
            orders: [] // Store order IDs for user
        };
        users.push(user);
        saveData(USERS_FILE, users); // Persist user data
        console.log(`User registered: ${user.email}`);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields: email, password' });
        }
        const user = users.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`User logged in: ${user.email}`);
        res.json({ success: true, token, isAdmin: user.isAdmin });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
});

// Plant routes
app.get('/api/plants', (req, res) => {
    try {
        const { category, featured, search } = req.query;
        let filteredPlants = [...plants]; // Use the loaded plants data

        if (category) {
            filteredPlants = filteredPlants.filter(plant => 
                plant.category.toLowerCase() === category.toLowerCase()
            );
        }

        if (featured === 'true') {
            filteredPlants = filteredPlants.filter(plant => plant.featured === true);
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            filteredPlants = filteredPlants.filter(plant =>
                plant.name.toLowerCase().includes(searchTerm) ||
                plant.description.toLowerCase().includes(searchTerm)
            );
        }

        res.json({ 
            success: true, 
            data: filteredPlants,
            count: filteredPlants.length 
        });
    } catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({ success: false, message: 'Error fetching plants' });
    }
});

app.get('/api/plants/:id', (req, res) => {
    try {
        const plantId = parseInt(req.params.id);
        const plant = plants.find(p => p.id === plantId);
        
        if (!plant) {
            return res.status(404).json({ 
                success: false, 
                message: 'Plant not found' 
            });
        }
        
        res.json({ success: true, data: plant });
    } catch (error) {
        console.error('Error fetching plant:', error);
        res.status(500).json({ success: false, message: 'Error fetching plant' });
    }
});

// Order routes
app.post('/api/orders', (req, res) => {
    try {
        const orderData = req.body;
        // Basic validation for required fields
        if (!orderData.customerName || !orderData.customerEmail || !orderData.customerAddress || !orderData.items || orderData.items.length === 0 || orderData.total === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required order fields (customerName, customerEmail, customerAddress, items, total)' });
        }

        const order = {
            id: uuid(), // Generate unique ID for the order
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        let userId = null;
        // Attempt to get userId from token if provided
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch (tokenError) {
                console.warn('Invalid token provided for order, proceeding as guest order:', tokenError.message);
                // If token is invalid, treat as guest order
            }
        }
        order.userId = userId; // Link order to user if logged in

        orders.push(order);
        const saved = saveData(ORDERS_FILE, orders); // Persist orders data

        if (userId) {
            const user = users.find(u => u.id === userId);
            if (user) {
                user.orders.push(order.id); // Add order ID to user's order list
                saveData(USERS_FILE, users); // Persist user data with new order
            }
        }

        if (saved) {
            console.log(`Order placed successfully: ${order.id} by ${order.customerEmail}`);
            res.json({ success: true, message: 'Order placed successfully', data: order });
        } else {
            throw new Error('Failed to save order to database');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Error placing order: ' + error.message });
    }
});

app.get('/api/user/orders', authenticate, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const userOrders = orders.filter(o => o.userId === user.id);
    res.json({ success: true, orders: userOrders });
});

// Admin routes
app.get('/api/admin/orders', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    res.json({ success: true, orders }); // Return all orders
});

app.get('/api/admin/plants', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    res.json({ success: true, data: plants }); // Return all plants
});

// Admin: Add new plant
app.post('/api/admin/plants', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    try {
        const { name, category, price, image, description, stock, featured } = req.body;
        if (!name || !category || !price || !image || !description || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required plant fields' });
        }
        const newPlant = {
            id: plants.length > 0 ? Math.max(...plants.map(p => p.id)) + 1 : 1, // Auto-increment ID
            name, category, price: parseFloat(price), image, description, stock: parseInt(stock), featured: !!featured
        };
        plants.push(newPlant);
        saveData(PLANTS_FILE, plants); // Persist plant data
        console.log(`New plant added: ${newPlant.name}`);
        res.json({ success: true, message: 'Plant added successfully', data: newPlant });
    } catch (error) {
        console.error('Error adding plant:', error);
        res.status(500).json({ success: false, message: 'Error adding plant' });
    }
});


app.get('/api/admin/users', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    // Return users without passwords for security
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json({ success: true, users: safeUsers });
});

async function initializeAdmin() {
    const adminExists = users.some(u => u.isAdmin);
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        users.push({
            id: uuid(),
            name: 'Admin',
            email: 'admin@natureparknursery.com',
            password: hashedPassword,
            isAdmin: true,
            orders: []
        });
        saveData(USERS_FILE, users);
        console.log('Admin created: admin@natureparknursery.com / admin123');
    }
}
initializeAdmin();

app.put('/api/admin/orders/:orderId/status', authenticate, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveData(ORDERS_FILE, orders); // Persist order status change

        console.log(`Order ${orderId} status updated to: ${status}`);
        res.json({ 
            success: true, 
            message: 'Order status updated successfully',
            data: orders[orderIndex]
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Error updating order status' });
    }
});

app.get('/api/admin/stats', authenticate, (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const totalOrders = orders.length;
        const totalUsers = users.length;
        const totalPlants = plants.length;
        
        const ordersByStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const totalRevenue = orders
            .filter(order => order.status !== 'cancelled' && order.total !== undefined)
            .reduce((sum, order) => sum + (order.total || 0), 0);

        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        const plantsByCategory = plants.reduce((acc, plant) => {
            acc[plant.category] = (acc[plant.category] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalOrders,
                totalUsers,
                totalPlants,
                totalRevenue,
                ordersByStatus,
                plantsByCategory,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

// Contact route
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields (name, email, message) are required' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        const contactMessage = {
            id: uuid(),
            name,
            email,
            message,
            createdAt: new Date().toISOString()
        };

        console.log('Contact form submission:', contactMessage);
        // In a real app, you'd save this to a file/DB or send an email.
        // For now, just log and respond.

        res.json({ 
            success: true, 
            message: 'Thank you for your message! We will get back to you soon.' 
        });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

// Error handling for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

// Server startup
app.listen(PORT, () => {
    console.log(`Plant Nursery API Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Data files are located in: ${DATA_DIR}`);
    console.log(`Available routes:`);
    console.log(`  GET  /api/plants`);
    console.log(`  GET  /api/plants/:id`);
    console.log(`  POST /api/orders`);
    console.log(`  POST /api/contact`);
    console.log(`  POST /api/register`);
    console.log(`  POST /api/login`);
    console.log(`  GET  /api/user/orders (requires auth)`);
    console.log(`  GET  /api/admin/* (requires admin auth)`);
});