import React from "react"
import { BrowserRouter,Routes,Route } from "react-router-dom"

import Register from "./Register";
import Login from "./Login"

import Home from "./Home";
import Message from "./Message"

import Layout from "./Layout";
import Updates from "./Updates";

import Calls from "./Calls"


function App(){


  return(

<BrowserRouter>
<Routes>

<Route path="/login"
element={<Login/>}
/>

<Route path="/"
element={<Register/>}
/>

<Route element={<Layout/>}>

<Route path="/home"
element={<Home/>}
/>

<Route path="/updates"
element={<Updates/>}
/>

</Route>

<Route path="/message/:id"
element={<Message/>}
/>

<Route path="/calls"
element={<Calls/>}
/>



</Routes>
</BrowserRouter>
 )
}export default App;

