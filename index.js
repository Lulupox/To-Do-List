const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Initialisation de la base de données
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the tasks database.');
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                done INTEGER NOT NULL
            )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

// Route pour récupérer toutes les tâches
app.get('/tasks', (req, res) => {
    db.all('SELECT * FROM tasks', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({error: 'Error fetching tasks'});
        } else {
            res.json(rows);
        }
    });
});

// Route pour ajouter une tâche
app.post('/tasks', (req, res) => {
    let task = req.body;
    task.done = task.done ? 1 : 0;
    let sql = 'INSERT INTO tasks(title, description, done) VALUES(?, ?, ?)';
    db.run(sql, [task.title, task.description, task.done], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({error: 'Error adding task'});
        } else {
            task.id = this.lastID;
            res.json(task);
        }
    });
});

// Route pour noter une tâche
app.put('/tasks/:id', (req, res) => {
    let taskId = req.params.id;
    let done = req.body.done;
    let sql = 'UPDATE tasks SET done = ? WHERE id = ?';
    db.run(sql, [done ? 1 : 0, taskId], (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({error: 'Error updating task'});
        } else {
            db.get(`SELECT * FROM tasks WHERE id = ${taskId}`, (err, row) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).json({error: 'Error fetching task'});
                } else {
                    res.json(row);
                }
            });
        }
    });
});


// Route pour supprimer une tâche
app.delete('/tasks/:id', (req, res) => {
    let taskId = req.params.id;
    let sql = 'DELETE FROM tasks WHERE id = ?';
    db.run(sql, taskId, (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({error: 'Error deleting task'});
        } else {
            res.json({message: 'Task deleted'});
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

const port = 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
