import sqldb from "@/server/config/sql.ts";
import allBlogs from "./queryBlog";

export const dbsql = sqldb;

dbsql.connect(err => {
    if(err) console.log(err);
});

export const Blogs = allBlogs;