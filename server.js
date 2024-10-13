const express = require('express');
const path = require('path');
const cors = require('cors');  // Import the cors package

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve the static HTML file
app.use(express.static(path.join(__dirname, 'public')));

// Your getWalletByID function should be imported or written in this file
const { getWalletByID, main } = require('./src/main.js'); // Update with actual script path

// API endpoint to get wallet data by employee name
app.get('/api/wallet', async (req, res) => {
    const employeeName = req.query.name;
    try {
        const walletData = await getWalletByID(employeeName);
        if (walletData) {
            res.json(walletData);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

// API endpoint to run the main function
app.post('/api/run-main', async (req, res) => {
    try {
        await main();  // Run the main function
        res.status(200).json({ message: 'Main function executed successfully' });
    } catch (error) {
        console.error('Error in executing main function:', error);
        res.status(500).json({ message: 'Failed to execute main function', error: error.message });
    }
});

const PORT = process.env.PORT || 3002; // Update port number to avoid conflicts
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
