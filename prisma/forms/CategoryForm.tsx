"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CategoriesForm() {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    image: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileKey, setFileKey] = useState("file-0"); // Unique key to reset input

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=category");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event:", e);

    const selected = e.target.files?.[0] || null;
    setErrorMsg("");

    if (!selected) {
      console.log("No file selected");
      return;
    }

    // Maximum allowed size in KB
    const maxSizeKB = 300;
    const maxSizeBytes = maxSizeKB * 1024;

    console.log(
      "Selected file size (bytes):",
      selected.size,
      "Max allowed size (bytes):",
      maxSizeBytes
    );

    if (selected.size > maxSizeBytes) {
      setErrorMsg(`Image must be smaller than ${maxSizeKB}KB.`);
      console.log("File rejected: too large");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    console.log("Selected file accepted:", selected);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // if (!editId && !file) {
    //   setErrorMsg("Image is required when creating a category.");
    //   return;
    // }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);

      if (file) {
        data.append("file", file); // new upload
      } else if (editId && formData.image) {
        data.append("image", formData.image); // keep existing image
      }

      if (editId) data.append("id", editId);

      const config = { headers: { "Content-Type": "multipart/form-data" } };

     for (const [key, value] of data.entries() as Iterable<[string, any]>) {
      console.log(key + ": ", value);
    }

      if (editId) {
        await axios.put(`/api/dbhandler?model=category&id=${editId}`, data, config);
      } else {
        await axios.post(`/api/dbhandler?model=category`, data, config);
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
    });

    setFile(null);
    setPreview(null);
    setErrorMsg("");
    setFileKey(`file-${Date.now()}`); // Reset input key
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/dbhandler?model=category&id=${id}`);
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", description: "", image: "" });
    setFile(null);
    setPreview(null);
    setEditId(null);
    setErrorMsg("");
    setFileKey(`file-${Date.now()}`); // Reset input key
  };

  return (
    <div className="flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm gap-3 p-4 border-2 border-secondary-foreground rounded-md m-2"
      >
        <h2 className="font-semibold text-lg">Manage Product Categories</h2>

        {errorMsg && (
          <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
        )}

        <Input
          type="text"
          placeholder="Category Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />

        <Input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <input
          ref={fileInputRef}
          key={fileKey}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border p-1 rounded-md"
        />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 rounded-md mt-2 border"
          />
        ) : formData.image ? (
          <img
            src={formData.image}
            alt="Category"
            className="w-20 h-20 rounded-md mt-2 border"
          />
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : editId ? "Update" : "Create"}
        </Button>

        {editId && (
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={resetForm}
          >
            Cancel Edit
          </button>
        )}

        <ul className="w-full mt-4">
          {categories.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col items-center gap-2 my-2 bg-secondary rounded-md w-full p-3"
            >
              <p className="font-medium">
                {index + 1}. {item.name}
              </p>

              {item.image && (
                <img
                  src={item.image}
                  className="w-16 h-16 rounded-md border"
                  alt="category"
                />
              )}

              <div className="flex flex-row gap-2 w-full">
                <Button type="button" onClick={() => handleEdit(item)} className="flex-1">
                  Edit
                </Button>

                <Button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  variant="ghost"
                  className="flex-1 border border-accent"
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}
