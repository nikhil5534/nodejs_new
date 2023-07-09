import express from "express";
import ejs, { name } from 'ejs';
import path from "path";
import mongoose from "mongoose"; 
import cookieParser from "cookie-parser";
import  Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
mongoose.connect("mongodb://localhost:27017/backend").then(()=>
    console.log("Database Connected"))
    .catch((e)=> console.log(e));
const userSchema =new mongoose.Schema({
    name:String,
    email:String,
    password:String
});
const User=mongoose.model("User",userSchema)
const app =express();
const users =[];
const isAuthenticated=async (req,res,next) =>{
    const {token} =req.cookies;
    if (token) {

        const decoded=Jwt.verify(token,"cgyegfuruwfkejeyeg23yvge")
        req.user =await User.findById(decoded._id);

        next()
    } else {
        res.redirect("/login")
    }
};

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine","ejs")
app.get("/",isAuthenticated, (req,res) => {
    res.render("logout" , {name:req.user.name} )
    
});
app.get("/resister",(req,res)=>{
        res.render("resister");
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.post("/login", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        return res.redirect("/resister");
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
    return res.render("login", { message: "Incorrect Password!" });
    }
    const token = Jwt.sign({ _id: user._id }, "cgyegfuruwfkejeyeg23yvge");
    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 100),
    });

    res.redirect("/");
});

app.post("/resister",async(req,res)=>{
    const {name ,email,password}=req.body;
    let user = await User.findOne({email})
    if (user) {
       return res.redirect("/login");
    }
    const hashedPassword=await bcrypt.hash(password,10)
    user =await User.create({
        name,
        email,
        password:hashedPassword,
    });
    const token =Jwt.sign({_id:user._id},"cgyegfuruwfkejeyeg23yvge");
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*100)
    })

    res.redirect("/")
});
app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now())
    })

    res.redirect("/")
})

app.listen(3000,() => {
    console.log("Server is running at port 3000");
});