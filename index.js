import express from 'express';
import { sendMessage } from './smsender.js';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.use(express.json());
app.post('/', async function (req, res) {
    const { msg } = req.body;
    console.log(msg);
    if (!msg) {
        return res.status(400).json({ error: "Missing a msg" });
    }
    const rs = await sendMessage(process.env.TMP_TO, msg);
    return res.status(200).json(rs);
});

app.get("/", function (req, res) {
    return res.status(200).sendFile(path.join(__dirname, "/views/index.html"));
})

app.listen(process.env.PORT || 8000, () => {
    console.log(`Listening on ${process.env.PORT || 8000} port!`);
})