"use client"
import { Button} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import React, { useRef, LegacyRef, useState, FormEvent } from 'react';
// import emailjs from '@emailjs/browser';
import { Toaster } from '@/components/ui/sonner';

const ContactForm = () => {
  const [details, setDetails] = useState({
    username : "",
    email : "",
    category : "",
    message : "",
    emailto : "adepojuololade2020@gmail.com",
  })
  
  interface RefObject<T> {
  readonly current: T | null
}
    
    const form = useRef<HTMLFormElement>(null);

    const sendMessage =async (e : FormEvent) => {
      e.preventDefault();

      const submitToServer =async ()=>{
        console.log(details)
        await fetch("/api/data/notification", {
          //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
          method: 'POST',
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(details),
          // body: JSON.stringify(form)
        })
        .then((response) => response.json())
        .then((data) => {form.current?.reset(); 
          setDetails({
            username : "",
            email : "",
            category : "",
            message : "",
            emailto : "adepojuololade2020@gmail.com",
          }); 
        alert(`Message sent successfully: ${data}`)})
        .catch((error) => console.error(error));
      }
      console.log(`about to send to server ${details}`)
      
      submitToServer()
    };


    const handleChange = (e : any)=>{
      const { name, value, files } = e.target;

      if (name === 'file') {
        setDetails((prevFormData) => ({ ...prevFormData, file: files[0] }));
      } else {
        setDetails((prevFormData) => ({ ...prevFormData, [name]: value }));
      }
    }




  return (
    <form ref={form  as RefObject<HTMLFormElement>} onSubmit={sendMessage}  className="flex flex-col gap-6 p-10 bg-secondary rounded-xl">
      {/* onSubmit={sendEmail} */}
        <h3 className="text-4xl text-accent mb-7">Message Us</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input type="firstname" name="username" placeholder="Username" onChange={handleChange} className="rounded-sm bg-background" />
          <Input type="email" name="email" placeholder="Email address" onChange={handleChange} className="rounded-sm bg-background" />
        </div>
        <select name="category" value={details.category} onChange={handleChange} className='bg-secondary border-2 border-border h-8 ring-1 rounded-sm ring-accent/30'>
                <option value="suggestion"> Suggestion </option>
                <option value="complaint"> Complaint</option>
                <option value="advert"> Advert </option>
                <option value="appreciate">Appreciate</option>
        </select>
        <Textarea className="h-[120px]" name="message" onChange={handleChange} placeholder="Type your message here" />
        <Button type="submit" className="before:ani-shadow">Submit</Button>
    </form>
  )
}

export default ContactForm
