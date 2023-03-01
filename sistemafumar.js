// Conexión a la base de datos
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'usuario',
    password: 'contraseña',
    database: 'basedatos'
});

mp.events.add('playerJoin', (player) => {
    // Crea la tabla salud_personaje si no existe
    connection.query('CREATE TABLE IF NOT EXISTS salud_personaje (id INT NOT NULL AUTO_INCREMENT, player_id VARCHAR(64) NOT NULL, salud INT NOT NULL, PRIMARY KEY (id));');
    
    // Obtiene la salud del jugador desde la tabla y la guarda en la variable del jugador
    connection.query(`SELECT salud FROM salud_personaje WHERE player_id = '${player.socialClub}'`, (error, results, fields) => {
        if (error) throw error;
        if (results.length === 0) {
            // Si no hay registros de salud del jugador, se crea uno con el valor por defecto
            connection.query(`INSERT INTO salud_personaje (player_id, salud) VALUES ('${player.socialClub}', 100);`);
            player.setVariable('salud_personaje', 100);
        } else {
            // Si hay registros de salud del jugador, se recupera el valor del último registro
            player.setVariable('salud_personaje', results[results.length - 1].salud);
        }
    });
});

mp.events.add('playerQuit', (player) => {
    // Guarda la salud del jugador en la tabla
    connection.query(`INSERT INTO salud_personaje (player_id, salud) VALUES ('${player.socialClub}', ${player.getVariable('salud_personaje')});`);
});

mp.events.add('playerCommand', (player, command) => {
    if (command === 'fumar') {
        let item = player.getInventoryItem('cigarro'); //Nombre de item por defecto que he puesto yo, en este caso no se como se llama en el servidor.
        if (!item) {
            player.outputChatBox('No tienes cigarros en tu inventario.');
            return;
        }
        player.playAnimation('amb@world_human_smoking@male@male_a@enter', 'enter', 1, 49);
        setTimeout(() => {
            player.playAnimation('amb@world_human_smoking@male@male_a@idle_a', 'idle_c', 1, 49);
        }, 2500);
        item.quantity--;
        player.outputChatBox(`Estás fumando un cigarro.`);
        player.health = Math.max(player.health - 5, 0);
        player.setVariable('salud_personaje', Math.max(player.getVariable('salud_personaje') - 5, 0));
        // Actualiza la salud del jugador en la tabla
        connection.query(`INSERT INTO salud_personaje (player_id, salud) VALUES ('${player.socialClub}', ${player.getVariable('salud_personaje')});`);
    } else if (command === 'misalud') {
        const salud = player.getVariable('salud_personaje');
        if (salud >= 70) {
            player.outputChatBox('Deberías fumar menos.');
        } else if (salud >= 50) {
            player.outputChatBox('Tu salud está en un punto crítico.');
        } else {
            player.outputChatBox('Tu salud está muy baja.');
        }
    }
    if (player.getVariable('salud_personaje') < 70) {
        player.canSprint = false;
        setTimeout(() => {
            player.canSprint = true;
        }, 5000);
    }
    
    // Comprueba la salud del jugador para ver si puede saltar
    if (player.getVariable('salud_personaje') < 5) {
        player.canJump = false;
    }
});
