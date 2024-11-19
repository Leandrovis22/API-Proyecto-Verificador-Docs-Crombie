const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv").config;

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "proccess.env.EMAIL",
    pass: "proccess.env.EMAIL_PASSWORD",
  },
});

exports.sendResetPasswordEmail = async (req, res) => {
  const { correo } = req.body;

  try {
    const user = await prisma.Usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No existe una cuenta con ese correo electrónico." });
    }

    const token = jwt.sign({ correo }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: "siproyecto0@gmail.com",
      to: correo,
      subject: "Restablece tu contraseña",
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>Este enlace expira en 1 hora.</p>`,
    };
    console.log(token);

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Correo enviado con éxito." });
  } catch (error) {
    console.error("Error de Nodemailer: ", error);
    res.status(500).json({ message: "Error al enviar el correo.", error });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.Usuario.update({
      where: { correo: decoded.correo },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Contraseña modificada con éxito." });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ message: "El enlace ha expirado." });
    }
    res
      .status(500)
      .json({ message: "Error al restablecer la contraseña.", error });
  }
};
