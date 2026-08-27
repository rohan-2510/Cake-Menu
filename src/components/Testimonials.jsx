// ============================================
// Testimonials Section
// ============================================
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/products';
import './Testimonials.css';

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setCurrent((c) => (c + 1) % TESTIMONIALS.length);

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
              {Array.from({ length: TESTIMONIALS[current].rating }).map((_, i) => (
                <Star key={i} size={16} fill="var(--color-gold)" stroke="var(--color-gold)" />
              ))}
            </div>
            <p className="testimonials__text">{TESTIMONIALS[current].text}</p>
            <div className="testimonials__author">
              <div className="testimonials__avatar">
                {TESTIMONIALS[current].name.charAt(0)}
              </div>
              <div>
                <span className="testimonials__name">{TESTIMONIALS[current].name}</span>
                <span className="testimonials__item">ordered {TESTIMONIALS[current].item}</span>
              </div>
            </div>
          </div>

          <button className="testimonials__arrow testimonials__arrow--right" onClick={next} aria-label="Next testimonial">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className="testimonials__dots">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`testimonials__dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
