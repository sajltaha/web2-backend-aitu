const express = require('express')
const app = express()
const fs = require('fs')
const DATA_FILE = './data.json'

function readData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

app.use(express.json())

// Basic endpoints

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from server!' })
})

app.get('/time', (req, res) => {
    res.send(new Date().toISOString())
})

app.get('/status', (req, res) => {
    res.status(200).json({ status: 'OK' })
})

// Task management endpoints

app.get('/tasks', (req, res) => {
    const data = readData()
    res.json(data.objects)
})

app.post('/tasks', (req, res) => {
    const data = readData()
    const task = {
        id: Date.now(),
        name: req.body.name
    }

    data.objects.push(task)

    writeData(data)
    res.json(task)
})

app.put('/tasks/:id', (req, res) => {
    const data = readData()
    const id = +req.params.id
    const task = data.objects.find(task => task.id === id)

    if (!task) return res.status(404).json({ error: 'Not found' })

    task.name = req.body?.name

    writeData(data)
    res.json(task)
})

app.delete('/tasks/:id', (req, res) => {
    const data = readData()
    const id = +req.params.id

    data.objects = data.objects.filter(task => task.id !== id)

    writeData(data)
    res.json({ success: true })
})


app.listen(3000, () => {
    console.log('Server started on port 3000')
})
