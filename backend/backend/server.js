const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret'; // Use env in production

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Critical middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: true,
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

// Global variables
let orders = [];
let users = [];
let plants = [
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
    { id: 13, name: "Magai Paan", category: "medicinal", price: 20, image: "https://plantsden.com/cdn/shop/products/beetel-leaf-500x500.jpg?v=1675328994", description: "Magai Paan leaves are used for digestion and are culturally significant in India.", stock: 25, featured: false },
    { id: 14, name: "Long Pepper", category: "medicinal", price: 20, image: "https://tse3.mm.bing.net/th/id/OIP.yAxJVTlVI3BPJGb558qUKgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Long Pepper is used in Ayurveda for respiratory issues, digestion, and boosting metabolism.", stock: 20, featured: false },
    { id: 15, name: "Black Pepper", category: "medicinal", price: 20, image: "https://balconygardenweb.b-cdn.net/wp-content/uploads/2020/04/How-to-Grow-Black-Pepper-Plant.jpg", description: "Black Pepper is a common spice with medicinal properties aiding digestion and immunity.", stock: 30, featured: false },
    { id: 16, name: "Gulvel", category: "medicinal", price: 20, image: "https://www.iafaforallergy.com/wp-content/uploads/2023/11/Guduci-Tinospora-cordifolia.webp", description: "Gulvel (Giloy) is highly regarded in Ayurveda for immunity boosting and detoxification.", stock: 35, featured: true },
    { id: 17, name: "Aghada", category: "medicinal", price: 20, image: "https://media.assettype.com/agrowon/2024-07/f699374e-df70-4610-a483-b3edffb636b2/7.jpg", description: "Aghada is used in traditional remedies for cough, cold, and skin ailments.", stock: 25, featured: false },
    { id: 18, name: "Insulin Plant", category: "medicinal", price: 25, image: "https://m.media-amazon.com/images/I/513OnsahqyL._UF1000,1000_QL80_.jpg", description: "Insulin Plant is known for managing blood sugar levels naturally.", stock: 20, featured: true },
    { id: 19, name: "Khuskus", category: "medicinal", price: 25, image: "https://plantsguru.com/cdn/shop/files/pg-khus-plant.jpg?v=1735618432&width=3000", description: "Khuskus is valued for its cooling properties and is used in traditional drinks and remedies.", stock: 15, featured: false },
    { id: 20, name: "Damaki Vel", category: "medicinal", price: 25, image: "https://nurserylive.com/cdn/shop/products/nurserylive-sankrant-vel-flame-vine-plant-2_525x700.jpg?v=1634227996", description: "Dhamaki Vel is used in Ayurveda for treating asthma and respiratory conditions.", stock: 18, featured: false },
    { id: 31, name: "Sadaphuli", category: "flower", price: 20, image: "https://cdn.mos.cms.futurecdn.net/YVHbF9xrUUM9cmDWWFtzt4.jpg", description: "Sadaphuli (Periwinkle) is an ornamental flower with medicinal properties, used for diabetes and blood pressure control.", stock: 40, featured: true },
    { id: 32, name: "Gokarn", category: "flower", price: 20, image: "https://www.yoidentity.com/wp-content/uploads/2020/07/Yoidentity-Clitoria-Ternatea-Gokarna-Aparajita-Blue-Plant.jpg", description: "Gokarn (Butterfly Pea) is valued for its beautiful blue flowers and memory-enhancing benefits.", stock: 35, featured: false },
    { id: 33, name: "Gurmar", category: "flower", price: 25, image: "https://www.planetayurveda.com/wp-content/uploads/2019/04/Gurmar-Plant-Images-Madhunashini-plant-images.jpg", description: "Gurmar is traditionally used in Ayurveda to manage blood sugar levels and improve digestion.", stock: 20, featured: false },
    { id: 34, name: "Jaswand", category: "flower", price: 20, image: "https://4.imimg.com/data4/NW/QV/MY-29793251/red-jaswand-flower-plant-500x500.jpg", description: "Jaswand (Hibiscus) is used for hair growth, skincare, and as a natural cooling drink.", stock: 50, featured: true },
    { id: 35, name: "Jui", category: "flower", price: 20, image: "https://plantsguru.com/cdn/shop/files/Jui_Plant_Juhi_Jasminum_auriculatum.jpg?v=1746038852&width=1100", description: "Jui (Jasmine) is admired for its fragrance and is used in perfumes and calming herbal teas.", stock: 45, featured: true },
    { id: 51, name: "Cuphea", category: "ornamental", price: 20, image: "https://farm4.staticflickr.com/3198/3090919131_6096bd4561_o_d.jpg", description: "Cuphea is a small ornamental plant with bright flowers.", stock: 30, featured: false },
    { id: 52, name: "Agave", category: "ornamental", price: 25, image: "https://tse4.mm.bing.net/th/id/OIP.lBu8lfnbdSwiEDlt9Lnl2QHaJu?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", description: "Agave is a succulent plant known for its rosette shape.", stock: 25, featured: false },
    { id: 53, name: "Laalmaath", category: "ornamental", price: 20, image: "https://th.bing.com/th/id/R.e2ceb5dcac429ddeb66f8e3af131af8e?rik=0OvcvwpGqh5z0A&riu=http%3a%2f%2fseedandplant.com%2fcdn%2fshop%2ffiles%2fLaal_Saag-Leafy-Vegetable_Seed-_Open_Pollinated.jpg%3fv%3d1687977597&ehk=ZhZ%2fGmj9k0fqjrSuDS2NNxhkvXEwWeObS7d3RXPDXQQ%3d&risl=&pid=ImgRaw&r=0", description: "Laalmaath is an ornamental plant with reddish foliage.", stock: 35, featured: false },
    { id: 54, name: "Aralia", category: "ornamental", price: 20, image: "https://img.crocdn.co.uk/images/products2/pl/20/00/03/08/pl2000030879.jpg?width=940&height=940", description: "Aralia is a decorative plant often grown indoors.", stock: 40, featured: false },
    { id: 55, name: "Bamboo", category: "ornamental", price: 50, image: "https://i.pinimg.com/originals/6c/85/53/6c85531f3f6787495869ef2a733eff52.jpg", description: "Bamboo is a fast-growing plant symbolizing strength and flexibility.", stock: 20, featured: true },
    { id: 86, name: "Bel", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/41Nn89jB97L.jpg", description: "Bel tree (Aegle marmelos) valued for its medicinal fruits and religious use.", stock: 15, featured: false },
    { id: 87, name: "Kanchan", category: "tree", price: 20, image: "https://m.media-amazon.com/images/I/61FkL-t4wxL.jpg", description: "Kanchan (Bauhinia) is a flowering tree known for its beautiful blossoms.", stock: 12, featured: false },
    { id: 98, name: "Mango", category: "tree", price: 30, image: "https://media.30seconds.com/tip/lg/How-to-Grow-a-Mango-Plant-From-Seed-Plus-Growing-Tips-So-I-58440-1a797b5f49-1682630452.jpg", description: "Mango is a popular fruit-bearing tree grown widely.", stock: 10, featured: true },
    { id: 123, name: "Papaya", category: "fruit trees", price: 20, image: "https://cdn.britannica.com/49/183449-050-1A2B4250/Papaya-tree.jpg", description: "Papaya produces nutritious fruits rich in vitamins.", stock: 25, featured: false },
    { id: 124, name: "Lemon", category: "fruit trees", price: 30, image: "https://www.thetreecenter.com/wp-content/uploads/meyer-lemon-tree-full-grown.jpg", description: "Lemon tree cultivated for sour, vitamin-rich fruits.", stock: 20, featured: true },
    { id: 125, name: "Drum Stick (Moringa)", category: "fruit trees", price: 30, image: "https://mygreenleaf.ae/wp-content/uploads/2024/01/moringa-tree.jpg", description: "Drum Stick tree (Moringa) grown for edible pods and nutritious leaves.", stock: 15, featured: true },
    { id: 126, name: "Nivadung", category: "live fences", price: 20, image: "https://c8.alamy.com/comp/F3GTNG/cactus-local-name-fadya-nivdung-district-sindhudurga-maharashtra-india-F3GTNG.jpg", description: "Nivadung used as a natural, thorny live fence.", stock: 30, featured: false },
    { id: 127, name: "Duranta", category: "live fences", price: 20, image: "https://www.thespruce.com/thmb/t2vJyU3CYPk2oENN3j3M1AlY84M=/2119x1414/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1130897014-d59bdd987c7241d7ba4eb1d84ed35976.jpg", description: "Duranta is a flowering shrub ideal for hedges and fencing.", stock: 35, featured: false }
];

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
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: uuid(),
            name,
            email,
            password: hashedPassword,
            isAdmin: false,
            orders: []
        };
        users.push(user);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
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
        let filteredPlants = [...plants];

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
        if (!orderData.customerName || !orderData.customerEmail || !orderData.customerAddress || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const order = {
            id: uuid(),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        let userId = null;
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
            } catch {}
        }
        order.userId = userId;
        orders.push(order);
        if (userId) {
            const user = users.find(u => u.id === userId);
            if (user) {
                user.orders.push(order.id);
            }
        }
        res.json({ success: true, message: 'Order placed successfully', data: order });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: 'Error placing order' });
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
    res.json({ success: true, orders });
});

app.get('/api/admin/plants', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    res.json({ success: true, data: plants });
});

app.get('/api/admin/users', authenticate, (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });
    res.json({ success: true, users });
});

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
            .filter(order => order.status !== 'cancelled')
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

        res.json({ 
            success: true, 
            message: 'Thank you for your message! We will get back to you soon.' 
        });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

// Error handling
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

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