// ============================================
// Testimonials Section
// ============================================
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { TESTIMONIALS as DEFAULT_TESTIMONIALS } from '../data/products';
import './Testimonials.css';

export default function Testimonials() {
  const { state } = useStore();
  const rawList = state.testimonials && state.testimonials.length > 0 ? state.testimonials : DEFAULT_TESTIMONIALS;
  const list = rawList.filter((t) => t.visible !== false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (list.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % list.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [list.length]);

  if (list.length === 0) return null;
  const activeIndex = current % list.length;
  const activeReview = list[activeIndex];

  const prev = () => setCurrent((c) => (c - 1 + list.length) % list.length);
  const next = () => setCurrent((c) => (c + 1) % list.length);

  return (
    <section className="testimonials section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <span className="accent-line font-accent">What our customers say</span>
          <h2 className="font-display">Loved by Sweet Lovers in Sirsi</h2>
          <p>Real reviews from our happy customers</p>
        </div>

        <div className="testimonials__carousel" id="testimonials-carousel">
          <button className="testimonials__arrow testimonials__arrow--left" onClick={prev} aria-label="Previous testimonial">
            <ChevronLeft size={20} />
          </button>

          <div className="testimonials__card">
            <Quote className="testimonials__quote-icon" size={32} />
            <div className="testimonials__stars">
              {Array.from({ length: Number(activeReview.rating) || 5 }).map((_, i) => (
                <Star key={i} size={16} fill="var(--color-gold)" stroke="var(--color-gold)" />
              ))}
            </div>
            <p className="testimonials__text">{activeReview.text}</p>
            <div className="testimonials__author">
              <div className="testimonials__avatar">
                {(activeReview.name || 'C').charAt(0)}
              </div>
              <div>
                <span className="testimonials__name">{activeReview.name}</span>
                {activeReview.item && (
                  <span className="testimonials__item">ordered {activeReview.item}</span>
                )}
              </div>
            </div>
          </div>

          <button className="testimonials__arrow testimonials__arrow--right" onClick={next} aria-label="Next testimonial">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className="testimonials__dots">
          {list.map((_, i) => (
            <button
              key={i}
              className={`testimonials__dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
