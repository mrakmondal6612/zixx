import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SelectIcon } from '@radix-ui/react-select';

const AdminDashboard = () => {
  const { user, role, loading } = useAuthContext();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (err) {
      // ignore
    }
  };
  // Track edit mode
  const [editId, setEditId] = useState(null);
  // Edit product: populate form with product data (map backend fields to form fields)
  const handleEditProduct = (prod: any) => {
    // Robustly handle color/colours/colors/colour and fallback to string
    let colorValue = '';
    if (Array.isArray(prod.colors) && prod.colors.length > 0) colorValue = prod.colors.join(', ');
    else if (Array.isArray(prod.color) && prod.color.length > 0) colorValue = prod.color.join(', ');
    else if (Array.isArray(prod.colours) && prod.colours.length > 0) colorValue = prod.colours.join(', ');
    else if (Array.isArray(prod.colour) && prod.colour.length > 0) colorValue = prod.colour.join(', ');
    else if (typeof prod.colors === 'string') colorValue = prod.colors;
    else if (typeof prod.color === 'string') colorValue = prod.color;
    else if (typeof prod.colours === 'string') colorValue = prod.colours;
    else if (typeof prod.colour === 'string') colorValue = prod.colour;

    setNewProduct({
      title: prod.title || '',
      description: prod.description || '',
      brand: prod.brand || '',
      gender: prod.gender || '',
      category: prod.category || '',
      subcategory: prod.subcategory || '',
      price: prod.price?.toString() || '',
      discount: prod.discount?.toString() || '',
      rating: prod.rating?.toString() || '',
      theme: prod.theme || '',
      size: Array.isArray(prod.size) ? prod.size.join(', ') : '',
      color: colorValue,
      images: Array.isArray(prod.image) ? prod.image : [], // backend: image, form: images
    });
    setEditId(prod._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Product loaded for editing. Make changes and submit to update.');
  };

  // Delete product (DELETE route)
  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/delete/${prodId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      let data = null;
      try { data = await res.json(); } catch {}
      if (res.ok && data && data.ok) {
        toast.success('Product deleted!');
        setProducts((prev: any) => prev.filter((p: any) => p._id !== prodId));
      } else {
        toast.error((data && data.msg) || 'Failed to delete');
        if (res.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error deleting product');
    }
  };

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    brand: '',
    gender: '',
    category: '',
    subcategory: '',
    price: '',
    discount: '',
    rating: '',
    theme: '',
    size: '', // comma separated string for form, array for backend
    color: '', // comma separated string for form, array for backend
    images: [], // array of image URLs for form, sent as 'image' to backend
  });

  const categories = ['T-Shirts', 'Shirts', 'Jeans', 'Dresses', 'Jackets', 'Accessories', 'Shoes', 'Bags'];
  const genders = ['Men', 'Women', 'Kids'];
  const themes = ['Best Sellers', 'New Arrivals', 'Limited Edition'];

  useEffect(() => {
    if (!loading && role !== 'admin') {
      toast.error('Unauthorized');
      navigate('/');
    }
  }, [role, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // List of required fields
    const requiredFields = [
      { key: 'title', label: 'Title' },
      { key: 'brand', label: 'Brand' },
      { key: 'gender', label: 'Gender' },
      { key: 'category', label: 'Category' },
      { key: 'subcategory', label: 'Subcategory' },
      { key: 'price', label: 'Price' },
      { key: 'description', label: 'Description' },
      { key: 'theme', label: 'Theme' },
    ];
    const missing = requiredFields.filter((f: any) => !newProduct[(f as any).key] || (newProduct as any)[(f as any).key].toString().trim() === '');
    if (missing.length > 0) {
      toast.error('Please fill: ' + missing.map((f: any) => f.label).join(', '));
      return;
    }

    // Map form fields to backend model: send both 'color' and 'colors' arrays for compatibility
    const colorArr = (newProduct.color ? (newProduct.color as string).split(',').map((c: string) => c.trim()).filter(Boolean) : []) as string[];
    const productToSubmit = {
      title: newProduct.title,
      description: newProduct.description,
      brand: newProduct.brand,
      gender: newProduct.gender,
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      price: newProduct.price ? parseFloat(newProduct.price as string) : 0,
      discount: newProduct.discount ? parseFloat(newProduct.discount as string) : 0,
      rating: newProduct.rating ? parseFloat(newProduct.rating as string) : 0,
      theme: newProduct.theme,
      size: newProduct.size ? (newProduct.size as string).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      color: colorArr,
      colors: colorArr,
      images: Array.isArray(newProduct.images) && newProduct.images.length > 0
        ? (newProduct.images as any[]).filter(img => !!img)
        : ['https://via.placeholder.com/300x300?text=No+Image'],
    };

    try {
      let res: Response, data: any;
      if (editId) {
        // Update existing product (PATCH, correct route)
        res = await fetch(`/api/products/update/${editId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(productToSubmit)
        });
        try { data = await res.json(); } catch {}
        if (res.ok && data && data.ok) {
          toast.success('Product updated successfully!');
          setProducts((prev: any) => prev.map((p: any) => p._id === editId ? data.data : p));
        } else {
          toast.error((data && data.msg) || 'Failed to update product');
          if (res.status === 401) {
            toast.error('Session expired. Please log in again.');
            navigate('/');
          }
          return;
        }
      } else {
        // Add new product
        res = await fetch('/api/products/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(productToSubmit)
        });
        data = await res.json();
        if (res.ok && data.ok) {
          toast.success('Product added successfully!');
          setProducts((prev: any) => [data.data, ...prev]);
        } else {
          toast.error(data.msg || 'Failed to add product');
          if (res.status === 401) {
            toast.error('Session expired. Please log in again.');
            navigate('/');
          }
          return;
        }
      }
      setNewProduct({
        title: '', description: '', brand: '', gender: '', category: '', subcategory: '', price: '',
        discount: '', rating: '', theme: '', size: '', color: '', images: []
      });
      setEditId(null);
    } catch (err) {
      toast.error('Error submitting product');
      console.error('Fetch error:', err);
    }
  };

  // Cloudinary unsigned upload preset and cloud name (replace with your values)
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
      toast.error("Missing Cloudinary config in .env");
      return;
    }

    setImageUploading(true);
    try {
      const uploaders = files.map(async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
          });
          const data = await res.json();

          if (data.secure_url) {
            return data.secure_url;
          } else {
            toast.error("Upload failed: " + (data.error?.message || "Unknown error"));
            return null;
          }
        } catch (err: any) {
          toast.error("Upload error: " + err.message);
          return null;
        }
      });

      const urls = (await Promise.all(uploaders)).filter(Boolean) as string[];

      if (urls.length > 0) {
        setNewProduct((prev: any) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
        toast.success("Images uploaded!");
      }
    } finally {
      setImageUploading(false);
    }
  };

  // Remove an image from the images array
  const handleRemoveImage = (idx: number) => {
    setNewProduct((prev: any) => ({ ...prev, images: (prev.images || []).filter((_: any, i: number) => i !== idx) }));
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <img
              src={(user as any)?.profile_pic || "/placeholder.svg"}
              alt="Admin"
              className="w-8 h-8 rounded-lg object-cover border border-gray-300 bg-white"
            />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your products and inventory</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Gen-Z Form */}
          <Card className="p-8 bg-gradient-to-br from-fuchsia-100 via-cyan-100 to-white rounded-3xl shadow-2xl border-2 border-fuchsia-200">
            <h2 className="text-4xl md:text-5xl font-black mb-10 flex flex-col md:flex-row items-center gap-4 md:gap-8 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-fuchsia-400 animate-gradient-x drop-shadow-2xl uppercase tracking-widest">
              <span className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 shadow-2xl border-4 border-white/60 animate-bounce-slow">
                <Plus className="w-10 h-10 md:w-12 md:h-12 text-white" />
              </span>
              <span className="text-center md:text-left">Add New Product</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols- lg:grid-cols-2 gap-8 md:gap-12">
                <div className="flex flex-col gap-4 border-fuchsia-200 hover:shadow-fuchsia-300 transition-shadow duration-300">
                  <Label className="text-base font-bold text-fuchsia-600">Title *</Label>
                  <Input required placeholder="Product Title" className="rounded-2xl border-2 border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-300 bg-white/80 font-bold text-cyan-700 placeholder:text-cyan-300 shadow-lg hover:scale-[1.03] transition-all duration-200" value={(newProduct as any).title} onChange={e => setNewProduct({ ...(newProduct as any), title: e.target.value })} />
                  <Label className="text-base font-bold text-fuchsia-600">Brand *</Label>
                  <Input required placeholder="Brand Name" className="rounded-2xl border-2 border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-300 bg-white/80 font-bold text-cyan-700 placeholder:text-cyan-300 shadow-lg hover:scale-[1.03] transition-all duration-200" value={(newProduct as any).brand} onChange={e => setNewProduct({ ...(newProduct as any), brand: e.target.value })} />
                  <Label className="text-base font-bold text-fuchsia-600">Gender *</Label>
                  <Select value={(newProduct as any).gender} onValueChange={value => setNewProduct({ ...(newProduct as any), gender: value })}>
                    <SelectTrigger className="rounded-2xl border-2 border-fuchsia-400 bg-white/80 font-bold text-fuchsia-700 shadow-lg hover:scale-[1.03] transition-all duration-200">

                        <SelectValue placeholder="Select Gender" />
                        <SelectIcon />
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>    
    