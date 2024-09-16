
CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,  
    apellido VARCHAR(255) NOT NULL,  
    dni BIGINT NOT NULL UNIQUE, 
    cuil BIGINT NOT NULL UNIQUE,  
    mail VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  
    telefono BIGINT NOT NULL,  
    rol VARCHAR(50) DEFAULT 'usuario', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);


CREATE TABLE tiqueteria (
    id INT PRIMARY KEY AUTO_INCREMENT, 
    userid INT NOT NULL,  
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente',  
    monto DECIMAL(10, 2) DEFAULT 0.00,  
    msq_error TEXT,  
    FOREIGN KEY (userid) REFERENCES usuario(id) 
);


CREATE TABLE dni (
    id INT PRIMARY KEY AUTO_INCREMENT,  
    foto_frente VARCHAR(255) NOT NULL,  
    foto_detras VARCHAR(255) NOT NULL,  
    res_textract JSON NOT NULL,  
    tiqueteria_id INT NOT NULL, 
    FOREIGN KEY (tiqueteria_id) REFERENCES tiqueteria(id)
);
