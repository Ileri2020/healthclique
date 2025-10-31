import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
// import mongodb from "./db/mongodb/index.ts";
import { compareSync } from "bcrypt-edge";
// import connect from "./config/mongodb.ts";
// import mongoose from "mongoose";
// import User from "./db/mongodb/users"



export const { handlers, signIn, signOut, auth } = NextAuth({
    // trustHost: true,   // makes an edge runtime error

    providers: [
        // GitHubProvider({ 
        //   clientId: process.env.GITHUB_ID,
        //   clientSecret: process.env.GITHUB_SECRET
        // }),

        Credentials({
            id: 'credentials', // Action provider ID
            name: "Credentials",

            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password"},
            },
            

            authorize: async (credentials): Promise<any>  => {//credentials {form actions used}
                   
                const email= credentials.email;
                const password = credentials.password;

                if (!email || !password) {
                    throw new Error("Please provide both email and password");
                }

                // console.log(`about to connect to database to login user ${email}`)

                // await connect()

                // let user

                // try {
                //     user = await User.findOne({ email : email }).select("+password +role")
                // } catch (error) {
                //     // users = mongoose.model('users', userSchema)
                //     console.log("unable to get user from database")
                // }

                let user

                const response = await fetch(`/api/data/finduser?email=${email}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    // query: { email: email },
                });
        
                if (response.ok) {
                user = await response.json();
                // return userData;
                } else {
                    throw new Error('Failed to fetch user data')
                }
          
                
                

                if (!user || !user.password) {
                    throw new Error("Invalid user email or password")
                }

                const isMatched = await compareSync( `${password}`, user.password)

                if (!isMatched) {
                    throw new Error("incorrect password or email")
                }


                const userData = {
                    firstName : user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    id: user._id,
                }

                return userData
            },
        }),
      ],

      pages: {
        signIn: "/account",
      },

      secret: process.env.AUTH_SECRET,

      callbacks: {
        async jwt({ token, user, profile, account }) {
            // Persist the Google ID to verify user sessions
            // if (profile) {
            // token.googleId = profile.sub;
            // }
            // console.log(token)
            // return token;
            if (user) {
                token.role = "user" // user?.role
            }
            return token
        },

        async session({ session, token }) {
            if (token?.sub && token?.role){
                session.user.id = token.sub
                // session.user.role = token.role
            }

            return session
        },

        async signIn({user, account}) {

            if (account.provider === "google"){

                try {
                    const { email, name, image, id } = user
                    // await connect()
                    // let alreadyUser

                    // try {
                    //     alreadyUser = await User.findOne({ email : email }).select("+password +role")
                    // } catch (error) {
                    //     // users = mongoose.model('users', userSchema)
                    //     console.log("unable to get user from database")
                    // }

                    let alreadyUser

                    const response = await fetch(`/api/data/finduser?email=${email}`, {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        // query: { email: email },
                    });
            
                    if (response.ok) {
                    user = await response.json();
                    // return userData;
                    } else {
                        throw new Error('Failed to fetch user data')
                    }

                    if(!alreadyUser) {
                        // try {
                        //     User.create({
                        //         // firstName: firstName,
                        //         // lastName: lastName,
                        //         email: email,
                        //         // password: hashedPassword,
                        //         // role: role,
                        //         image : image,
                        //         authProviderId : id
                        //     })
                        // } catch (error) {
                        //     // users = mongoose.model('users', userSchema)
                        //     console.log("unable to get user from database")
                        // }  
                        console.log("i need to create user account for you using api route")
                    } else {
                        return true
                    }
                }catch (error) {
                    console.log("error while creating user from google credentials")
                }
            }
        }


        },

        
})












// // import { getSession } from "@auth/express"

// dotenv.config()

// // export const google = new Google({
// //     clientId: process.env.GOOGLE_CLIENT_ID,
// //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
// //     callbackUrl: '/auth/google/callback',
// //   });

// //   app.get('/auth/google', async (req, res) => {
// //     const authorizationUrl = await google.getAuthorizationUrl();
// //     res.redirect(authorizationUrl);
// //   });
  
// //   app.get('/auth/google/callback', async (req, res) => {
// //     try {
// //       const tokens = await google.getAccessToken(req.query.code);
// //       const user = await google.getUserInfo(tokens.access_token);
// //       // Store user in session or database
// //       req.session.user = user;
// //       res.redirect('/protected');
// //     } catch (error) {
// //       console.error(error);
// //       res.status(401).send('Authentication failed');
// //     }
// //   });


// const authConfig = {
//     trustHost: true,

//     providers : [
//         // Google({
//         //     clientId: process.env.GOOGLE_CLIENT_ID,
//         //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         //     //add callback url to a server route after google auth to receive token ie [origin]/auth/callback/[provider]
//         //      callbackUrl: "/auth/google/callback", // Ensure this matches the route on your server
//         // }),
        
//     ],

//     jwt: {
//         secret: process.env.AUTH_SECRET,
//         // Enable cross-origin token verification
//         verify: { algorithms: ['HS256'] },
//       },

//     pages: {
//         signIn: "/auth/login",
//     },
//     secret: process.env.AUTH_SECRET,
//     callbacks: {
//         async jwt({ token, user, profile, account }) {
//           // Persist the Google ID to verify user sessions
//           if (profile) {
//             token.googleId = profile.sub;
//           }
//           console.log(token)
//           return token;
//         },
//         async session({ session, token }) {
//           session.user.googleId = token.googleId;
//           return session;
//         },
//       },
// }


// export default authConfig


