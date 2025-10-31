import { FaEnvelope } from "react-icons/fa"
import { CiLocationOn } from "react-icons/ci";
import { MdOutlineMessage, MdOutlinePhone } from "react-icons/md";


 
export default {
    title : "contact",
    description : "If you have any questions, inquiries, or would like to hire me, I would love to hear from you. Please feel free to reach out using the contact information provided below:",
    contact : [
        {
            icon: <FaEnvelope/>, // className="w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"
            text: "Email",
            value: "adepojuololade2020@gmail.com"
        },
        {
            icon : <MdOutlineMessage />, //className="w-[40px] h-[40px] text-accent hover:bg-accent hover:text-slate-100 rounded-md bg-transparent border-accent border-2 p-1"
            text : "Chat to us",
            value : "ileri2020.github.io"
        },
        {
            icon : <MdOutlinePhone/>,
            text: "Phone",
            value: "(+234) 816 968 4400"
        },
        {
            icon : <CiLocationOn/>,
            text: "address",
            value: "22 Akinagbe, Alapere, Ketu, Lagos State"
        },
    ],
    team : [
        {
            position : "President",
            name : "Deolu Adediran"
        },
        {
            position : "Director of STEM",
            name : "Joshua Ojerinde"
        },
        {
            position : "Public Relations",
            name : "Olamide Akinola"
        },
        {
            position : "Logistics Team Lead",
            name : "Kemi Falola"
        },
        {
            position : "Health and Safety Consultant",
            name : "Bolaji Ogunbunmi"
        },
        {
            position : "Quality Control",
            name : "Favour Akinsanya"
        },
        {
            position : "Information Technology",
            name : "Tolu Thomas"
        },
    ],
    partners : [
        {
            uri : "../assets/alstein.webp",
            name : "ALSTEIN",
        },
        {
            uri : "../assets/adels.webp",
            name : "Adels",
        },
        {
            uri : "../assets/alstein.webp",
            name : "SageIQ",
        },
        {
            uri : "../assets/adels.webp",
            name : "The Vemoye Foundation",
        },
    ],

}



