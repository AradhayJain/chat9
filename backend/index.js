import express, { urlencoded } from "express"
// import { messages } from "./data/message.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import MongoDB from "./utils/mognoDb.js"
import userRoutes from "./Routes/userRoutes.js"
import chatRoutes from "./Routes/chatRoutes.js"
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js"
import messageRoutes from "./Routes/messageRoutes.js"
import { Server } from "socket.io";
import path from "path"



dotenv.config({})
const app = express()
const port = process.env.PORT || 3000;
app.use(cookieParser())
const corsOptions={
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(urlencoded({ extended: true }))





MongoDB()

const server = app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
const io = new Server(server, {
    pingTimeOut: 60000,
    cors: {
        origin: "http://localhost:5173",
    }
})

io.on("connection", (socket) => {
    console.log("a user connected")
    socket.on("setup", (userData) => {
        socket.join(userData._id)
        console.log("user joined", userData._id)
        socket.emit("connected")
    })

    socket.on("join chat", (room) => {
        socket.join(room)
        console.log("room joined", room)
    })
    socket.on("typing", (room) => {
        console.log("typing", room)
        socket.to(room).emit("typing"); // Broadcast to everyone else in the room
    });

    socket.on("stop typing", (room) => {
        socket.to(room).emit("stop typing"); // Broadcast to everyone else in the room
    });
    socket.on("new message", (newMessage) => {
        var chat=newMessage.chat
        if (!chat.users) return console.log("chat.users not defined")
            chat.users.forEach((user) => {
                if (user._id === newMessage.sender._id) return;
                socket.in(user._id).emit("message received", newMessage)
            }
        )
    })
    socket.off("setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    })
    

})


app.use('/api/chat',chatRoutes)
app.use('/api/user',userRoutes)
app.use('/api/message',messageRoutes)

const __dirname=path.resolve()
if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname, '../frontend/dist')))
    app.get("*",(req,res)=>res.sendFile 
    (path.resolve(__dirname,"frontend","dist", "index.html")))
}
else{
    app.get("/",(req,res)=>{
        res.send("API is running")
    })
}





app.use(notFound)
app.use(errorHandler)