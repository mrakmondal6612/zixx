import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthProvider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, User, Pencil } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
  userId?: string;
}

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const [newReview, setNewReview] = useState({ name: '', rating: 0, comment: '' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const auth = useAuth();
  const user = auth?.user;
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl(`/clients/reviews/product/${productId}`));
        const json = await res.json();
        setReviews(json.data.map((r: any) => {
          const userObj = r?.userId && typeof r.userId === 'object' ? r.userId : null;
          const first = userObj?.first_name ?? '';
          const last = userObj?.last_name ?? '';
          const fullName = `${first} ${last}`.trim();
          return {
            id: r._id,
            name: fullName || r?.name || 'Anonymous',
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.createdAt).toISOString().split('T')[0],
            avatar: userObj?.profile_pic || '',
            userId: userObj?._id || (typeof r?.userId === 'string' ? r.userId : undefined),
          } as Review;
        }));
      } catch (err) {}
    })();
  }, [productId]);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const myReview = user
    ? reviews.find(r => r.userId === user._id)
    : null;

  const handleShowForm = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowForm(true);
    if (myReview) {
      setNewReview({
        name: myReview.name,
        rating: myReview.rating,
        comment: myReview.comment,
      });
      setEditing(true);
    } else {
      setNewReview({ name: '', rating: 0, comment: '' });
      setEditing(false);
    }
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await fetch(apiUrl(`/clients/reviews/${reviewId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error('Server error: ' + text.slice(0, 200));
      }
      const json = await res.json();
      if (res.status === 401) {
        navigate('/auth');
        return;
      }
      if (!res.ok) throw new Error(json.msg);
      setReviews(rs => rs.filter(r => r.id !== reviewId));
      setShowForm(false);
      setEditing(false);
      setNewReview({ name: '', rating: 0, comment: '' });
      alert('Review deleted successfully');
    } catch (err) {
      alert((err as any).message || 'Failed to delete review');
    }
  };

  // Helpers
  const isValidObjectId = (id?: string | null) => !!id && /^[a-fA-F0-9]{24}$/.test(id);
  const fetchReviewsRaw = async () => {
    const res = await fetch(apiUrl(`/clients/reviews/product/${productId}`));
    const json = await res.json();
    if (!res.ok) throw new Error(json.msg || 'Failed to refresh reviews');
    return json.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (editing && !myReview) {}
    try {
      const method = editing ? 'PUT' : 'POST';
      // Ensure we have a valid review ID when editing
      let reviewIdForEdit: string | undefined = myReview?.id;
      if (editing && !isValidObjectId(reviewIdForEdit)) {
        try {
          const raw = await fetchReviewsRaw();
          const mine = raw.find((r: any) => (r.userId?._id || r.userId) === user._id);
          if (mine && isValidObjectId(mine._id)) {
            reviewIdForEdit = mine._id;
          } else {
            alert('Could not locate your review to edit. Please reload the page.');
            return;
          }
        } catch (e) {
          alert('Failed to locate your review. Please reload the page and try again.');
          return;
        }
      }
      const url = editing
        ? apiUrl(`/clients/reviews/${reviewIdForEdit!}`)
        : apiUrl(`/clients/reviews/product/${productId}`);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment,
        }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error('Server error: ' + text.slice(0, 200));
      }

      const json = await res.json();
      if (res.status === 401) {
        navigate('/auth');
        return;
      }
      if (!res.ok) throw new Error(json.msg);
      const listRes = await fetch(apiUrl(`/clients/reviews/product/${productId}`));
      const listJson = await listRes.json();
      if (!listRes.ok) throw new Error(listJson.msg || 'Failed to refresh reviews');
      setReviews(listJson.data.map((r: any) => {
        const userObj = r?.userId && typeof r.userId === 'object' ? r.userId : null;
        const first = userObj?.first_name ?? '';
        const last = userObj?.last_name ?? '';
        const fullName = `${first} ${last}`.trim();
        return {
          id: r._id,
          name: fullName || r?.name || 'Anonymous',
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.createdAt).toISOString().split('T')[0],
          avatar: userObj?.profile_pic || '',
          userId: userObj?._id || (typeof r?.userId === 'string' ? r.userId : undefined),
        } as Review;
      }));
      setShowForm(false);
      setEditing(false);
      setNewReview({ name: '', rating: 0, comment: '' });
    } catch (err) {
      alert((err as any).message || 'Review submission failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <StarRating rating={average} readonly size="sm" />
          <span className="text-sm text-muted-foreground">
            ({reviews.length} reviews)
          </span>
        </div>
      </div>

      {/* Responsive Reviews Grid - center if 1-2, show all or limited, show button if >5 */}
      {/* Responsive Reviews Grid - center if 1 or 2 reviews */}
      <div
        className={
          reviews.length <= 2
            ? 'flex justify-center w-full'
            : ''
        }
      >
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full ${
            reviews.length <= 2 ? 'max-w-2xl' : ''
          }`}
        >
          {(showAll || reviews.length <= 5 ? reviews : reviews.slice(0, 5)).map((r, index) => (
          <div
            key={r.id}
            className={`p-8 rounded-2xl border ${index === 0 ? 'border-primary' : 'border-border'} bg-card flex flex-col shadow-lg w-full min-h-[240px] min-w-[360px] max-w-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.025]`}
          >
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={r.avatar} alt={r.name} />
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="font-semibold text-foreground">{r.name}</span>
                  <div className="w-5 h-5 bg-green-500 rounded-full ml-2 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  {user && r.userId === user._id && !showForm && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShowForm}
                        title="Edit your review"
                        className="hover:bg-accent/40 ml-2"
                      >
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReview(r.id)}
                        title="Delete your review"
                        className="hover:bg-destructive/10"
                      >
                        <span className="text-destructive font-bold text-xl">&times;</span>
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex mb-1">
                  {[...Array(r.rating)].map((_, i) => (
                    <span key={i} className="inline-block mr-1">
                      <svg className="w-5 h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 17.75l-6.172 3.245 1.179-6.873-5-4.873 6.9-1.002L12 2.5l3.093 6.747 6.9 1.002-5 4.873 1.179 6.873z"/></svg>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{r.date}</p>
            <p className="text-muted-foreground">{r.comment}</p>
          </div>
          ))}
        </div>
      </div>
      {/* Show all reviews button */}
      {reviews.length > 5 && !showAll && (
        <div className="flex justify-center mt-6">
          <Button
            className="bg-primary text-white font-semibold px-8 py-2 rounded-lg shadow hover:bg-primary/90 transition"
            onClick={() => setShowAll(true)}
          >
            Show all reviews
          </Button>
        </div>
      )}

      {/* Review Form Section - below all reviews */}
      <div className="max-w-xl mx-auto mt-12">
        <div className="bg-background border border-muted rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-center justify-center">
            <MessageCircle className="w-6 h-6" />
            {myReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          {!showForm ? (
            user ? (
              <Button
                onClick={handleShowForm}
                className="bg-primary text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-primary/90 transition w-full"
              >
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-primary text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-primary/90 transition w-full"
              >
                Login to Write a Review
              </Button>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="block mb-1 text-sm font-medium">Your Name</Label>
                <Input
                  id="name"
                  value={
                    (user as any)?.first_name
                      ? `${(user as any).first_name} ${(user as any).last_name || ''}`
                      : (user as any)?.email || ''
                  }
                  disabled
                  className="w-full bg-muted/40 border border-muted rounded-lg px-4 py-2 text-base"
                />
              </div>
              <div>
                <Label className="block mb-1 text-sm font-medium">Rating</Label>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={newReview.rating}
                    onRatingChange={rating =>
                      setNewReview(prev => ({ ...prev, rating }))
                    }
                    size="lg"
                  />
                  <span className="text-sm text-muted-foreground">{newReview.rating ? `${newReview.rating} / 5` : ''}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="comment" className="block mb-1 text-sm font-medium">Your Review</Label>
                <Textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={e =>
                    setNewReview(prev => ({ ...prev, comment: e.target.value }))
                  }
                  rows={4}
                  required
                  className="w-full bg-muted/40 border border-muted rounded-lg px-4 py-2 text-base"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  type="submit"
                  className="bg-primary text-white font-semibold px-8 py-2 rounded-lg shadow hover:bg-primary/90 transition"
                  disabled={!newReview.rating}
                >
                  {editing ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="px-8 py-2 rounded-lg border border-muted"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
