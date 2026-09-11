import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import "./styles.css";

type Choice = { name: string; description: string; image: string };
type BookingData = {
  service: string;
  shape: string;
  length: string;
  design: string;
  colour: string;
  customColour: string;
  date: string;
  name: string;
  phone: string;
  notes: string;
};
const fallback =
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=88";
const services: Choice[] = [
  {
    name: "Manicure",
    description: "Nail care, shaping and polish",
    image: fallback,
  },
  {
    name: "Pedicure",
    description: "Restorative care for polished toes",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=84",
  },
  {
    name: "Acrylic",
    description: "Custom sculpted extensions",
    image:
      "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=1000&q=84",
  },
  {
    name: "Gel",
    description: "Glossy and long-lasting colour",
    image:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=84",
  },
  {
    name: "Press-ons",
    description: "Reusable sets made for you",
    image:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=84",
  },
  {
    name: "Removal",
    description: "Gentle professional removal",
    image:
      "https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=1000&q=84",
  },
  {
    name: "Refill",
    description: "A fresh fill and flawless finish",
    image: fallback,
  },
  {
    name: "Nail art",
    description: "Bespoke art and details",
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1000&q=84",
  },
];
const designs: Choice[] = [
  { name: "French", description: "Timeless", image: fallback },
  {
    name: "Chrome",
    description: "Reflective",
    image:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=84",
  },
  {
    name: "Cat-eye",
    description: "Dimensional",
    image:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=84",
  },
  {
    name: "Ombre",
    description: "Soft blend",
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=84",
  },
  {
    name: "Glitter",
    description: "Sparkle",
    image:
      "https://images.unsplash.com/photo-1612887390768-f29b5c7f5c26?auto=format&fit=crop&w=900&q=84",
  },
  {
    name: "Freestyle",
    description: "Artist-led",
    image:
      "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=84",
  },
];
const shapes = ["Square", "Almond", "Oval", "Coffin", "Stiletto", "Round"];
const lengths = ["Short", "Medium", "Long", "Extra-long"];
const steps = ["Service", "Shape", "Length", "Design", "Date", "Details"];
const swatches = [
  "Nude",
  "Pink",
  "Red",
  "Burgundy",
  "Black",
  "Purple",
  "Blue",
  "Gold",
];
const swatchHex = [
  "#e9d3c3",
  "#efa0bc",
  "#bf234b",
  "#75233e",
  "#171417",
  "#765197",
  "#4b688e",
  "#d1aa4f",
];
const whatsappNumber = "2347087777511";
const whatsappUrl = (
  message = "Hello Joy, I would like to book a nail appointment with DE_JOY ARTISTRY.",
) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
const imgError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallback;
};

function App() {
  return (
    <BrowserRouter>
      <RouteReset />
      <MotionEffects />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book" element={<Book />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <FloatingWhatsApp />
      <Footer />
    </BrowserRouter>
  );
}
function RouteReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const titles: Record<string, string> = {
      "/": "Luxury Nail Studio in Abuja",
      "/services": "Nail Services",
      "/book": "Book an Appointment",
      "/privacy": "Privacy Policy",
      "/terms": "Terms of Use",
    };
    document.title = `${titles[pathname] || "Luxury Nail Studio in Abuja"} | DE_JOY ARTISTRY`;
  }, [pathname]);
  return null;
}
function MotionEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".service-card, .gallery-grid figure",
      ),
    );
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    items.forEach((item, index) => {
      item.classList.add("reveal-item");
      item.style.setProperty("--reveal-delay", `${(index % 3) * 80}ms`);
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">ABUJA'S BESPOKE NAIL EXPERIENCE</span>
            <h1>
              Confidence, crafted
              <br />
              <em>at your fingertips.</em>
            </h1>
            <p>
              From refined simplicity to bold self-expression, every DE_JOY set
              is designed to reflect your style and elevate how you feel.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/book">
                Book your signature set <ArrowRight />
              </Link>
              <Link className="text-link" to="/services">
                Explore the artistry <ArrowRight />
              </Link>
            </div>
            <div className="hero-trust">
              <span>
                <ShieldCheck />
                Health-first care
              </span>
              <span>
                <MessageCircle />
                Personal confirmation
              </span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.pexels.com/photos/16363470/pexels-photo-16363470.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Elegant glitter manicure styled against soft pink fabric"
              onError={imgError}
            />
          </div>
        </div>
      </section>
      <section className="value-strip" aria-label="Studio benefits">
        <div className="container">
          <span>
            <Heart />
            Personal artistry
          </span>
          <span>
            <ShieldCheck />
            Careful preparation
          </span>
          <span>
            <Clock3 />
            Simple six-step booking
          </span>
          <span>
            <Star />
            Premium finish
          </span>
        </div>
      </section>
      <section className="intro">
        <div className="container intro-grid">
          <div>
            <span className="section-label">THE STUDIO</span>
            <h2>
              Your vision,
              <br />
              <em>beautifully refined.</em>
            </h2>
          </div>
          <div>
            <p>
              From immaculate minimal finishes to detailed statement sets, every
              appointment is approached with patience, precision, and a clear
              understanding of the look you want to carry.
            </p>
            <Link className="text-link dark-link" to="/services">
              Discover our services <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <section className="philosophy">
        <div className="container philosophy-grid">
          <div className="philosophy-image">
            <img
              src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=88"
              alt="Elegant manicure detail"
              onError={imgError}
            />
          </div>
          <div className="philosophy-copy">
            <span className="section-label">THE DE_JOY STANDARD</span>
            <h2>
              Considered care.
              <br />
              Distinctive results.
            </h2>
            <p>
              We pair a health-conscious approach with thoughtful structure,
              balanced proportions, and a finish that complements your hands.
              Your service, shape, length, colour, and design direction are
              considered together.
            </p>
            <ul>
              <li>
                <Check />A guided consultation before confirmation
              </li>
              <li>
                <Check />
                Design choices matched to your lifestyle
              </li>
              <li>
                <Check />
                Direct communication with your nail artist
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className="routing">
        <div className="container">
          <SectionHead
            label="FIND YOUR APPOINTMENT"
            title="Begin with the right service"
            text="Choose the closest starting point. Joy will personally confirm the final design, timing, availability, and price."
          />
          <div className="route-grid">
            <article>
              <span className="route-number">01</span>
              <span className="section-label">STRUCTURE</span>
              <h2>Sculpted extensions &amp; refills</h2>
              <p>
                Custom acrylic and gel enhancements designed around your
                preferred length and everyday routine.
              </p>
              <Link to="/book?service=Acrylic">
                Build an extension appointment <ArrowRight />
              </Link>
            </article>
            <article>
              <span className="route-number">02</span>
              <span className="section-label">ESSENTIALS</span>
              <h2>Gel &amp; natural nail care</h2>
              <p>
                Polished colour, careful grooming, and refined finishes for
                hands and feet.
              </p>
              <Link to="/book?service=Gel">
                Build a gel appointment <ArrowRight />
              </Link>
            </article>
          </div>
        </div>
      </section>
      <section className="journey">
        <div className="container">
          <header>
            <span className="section-label">YOUR BOOKING JOURNEY</span>
            <h2>Designed to feel effortless</h2>
            <p>
              Make your selections at your pace. Your request opens in WhatsApp,
              ready for Joy to review personally.
            </p>
          </header>
          <div className="journey-grid">
            <article>
              <span>01</span>
              <h3>Choose your foundation</h3>
              <p>
                Select the service, shape, and length that best matches your
                vision.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Define your direction</h3>
              <p>
                Add your design, colour, preferred date, and any helpful notes.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Confirm with Joy</h3>
              <p>
                Send the prepared request on WhatsApp and receive availability
                and final pricing.
              </p>
            </article>
          </div>
          <div className="center-action">
            <Link className="btn primary" to="/book">
              Start your booking <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <section className="final-cta">
        <div className="container">
          <span className="section-label">YOUR NEXT SET STARTS HERE</span>
          <h2>
            Ready to create something
            <br />
            <em>beautifully yours?</em>
          </h2>
          <p>
            Build your request in a few minutes. No payment is taken online.
          </p>
          <div>
            <Link className="btn light" to="/book">
              Book an appointment <ArrowRight />
            </Link>
            <a
              className="text-link light-link"
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Chat with Joy <MessageCircle />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
function Services() {
  return (
    <>
      <PageIntro
        label="SERVICES & INSPIRATION"
        title="Choose your starting point"
        text="Select a service and explore a design direction. Your exact set and final price are confirmed personally with Joy."
      />
      <section className="page-section">
        <div className="container">
          <div className="service-grid">
            {services.map((item, index) => (
              <Link
                to={`/book?service=${encodeURIComponent(item.name)}`}
                className="service-card"
                key={item.name}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="service-media">
                  <img
                    src={item.image}
                    alt={`${item.name} service`}
                    onError={imgError}
                  />
                </div>
                <div className="service-copy">
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <ArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="gallery-section">
        <div className="container">
          <SectionHead
            label="INSPIRATION"
            title="Find your direction"
            text="Choose a look as your starting point, bring your own reference, or leave the creative direction to Joy."
          />
          <div className="gallery-grid">
            {designs.map((item) => (
              <figure key={item.name}>
                <img
                  src={item.image}
                  alt={`${item.name} nail design`}
                  onError={imgError}
                />
                <figcaption>
                  <b>{item.name}</b>
                  <span>{item.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="center-action">
            <Link className="btn primary" to="/book">
              Build your set <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
function Book() {
  const [params] = useSearchParams();
  const requestedService = params.get("service");
  const initialService = services.some((item) => item.name === requestedService)
    ? requestedService!
    : "Gel";
  const [step, setStep] = useState(0),
    [service, setService] = useState(initialService),
    [shape, setShape] = useState("Almond"),
    [length, setLength] = useState("Medium"),
    [design, setDesign] = useState("Cat-eye"),
    [colour, setColour] = useState("Burgundy"),
    [customColour, setCustomColour] = useState(""),
    [date, setDate] = useState(""),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [notes, setNotes] = useState(""),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const selected = services.find((x) => x.name === service)!;
  const state: BookingData = {
    service,
    shape,
    length,
    design,
    colour,
    customColour,
    date,
    name,
    phone,
    notes,
  };
  const summary = useMemo(
    () =>
      `Hello Joy AD! I would like to request an appointment with DE_JOY ARTISTRY.\n\nName: ${name}\nPhone: ${phone || "Not provided"}\nPreferred date: ${date}\nService: ${service}\nShape: ${shape}\nLength: ${length}\nDesign: ${design}\nColour: ${customColour || colour}\nNotes: ${notes || "None"}\n\nPlease confirm availability and the final price.`,
    [
      name,
      phone,
      date,
      service,
      shape,
      length,
      design,
      colour,
      customColour,
      notes,
    ],
  );
  const validate = (target: number) => {
    if (target > 4 && !date)
      return "Choose your preferred date before continuing.";
    if (target > 5 && !name.trim())
      return "Enter your name before preparing the request.";
    return "";
  };
  const go = (target: number) => {
    const issue = validate(target);
    if (issue) {
      setError(issue);
      return;
    }
    setError("");
    setStep(Math.max(0, Math.min(5, target)));
    document
      .querySelector(".booking-shell")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const copy = async () => {
    const issue = validate(6);
    if (issue) {
      setError(issue);
      return;
    }
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setError("");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(
        "Copying was blocked. Select and copy the booking summary below.",
      );
    }
  };
  return (
    <>
      <PageIntro
        label="BOOKING ENQUIRY"
        title="Build your appointment"
        text="A guided six-step booking request designed for clarity. Your preferred date and final price are confirmed personally with Joy."
      />
      <section className="book-section">
        <div className="booking-shell">
          <div className="progress-head">
            <div>
              <span>YOUR BOOKING</span>
              <b>Step {step + 1} of 6</b>
            </div>
            <div
              className="meter"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={6}
              aria-valuenow={step + 1}
            >
              <i style={{ width: `${((step + 1) / 6) * 100}%` }} />
            </div>
            <nav aria-label="Booking progress">
              {steps.map((item, index) => (
                <button
                  type="button"
                  className={
                    index === step ? "active" : index < step ? "done" : ""
                  }
                  onClick={() => go(index)}
                  aria-current={index === step ? "step" : undefined}
                  key={item}
                >
                  <span>{index < step ? <Check /> : index + 1}</span>
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="wizard-layout">
            <section className="wizard-main">
              <BookingStep
                step={step}
                data={state}
                setService={setService}
                setShape={setShape}
                setLength={setLength}
                setDesign={setDesign}
                setColour={setColour}
                setCustomColour={setCustomColour}
                setDate={setDate}
                setName={setName}
                setPhone={setPhone}
                setNotes={setNotes}
              />
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <div className="wizard-actions">
                {step > 0 ? (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => go(step - 1)}
                  >
                    <ChevronLeft /> Back
                  </button>
                ) : (
                  <span />
                )}
                {step < 5 ? (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => go(step + 1)}
                  >
                    Continue <ChevronRight />
                  </button>
                ) : name.trim() && date ? (
                  <a
                    className="btn whatsapp"
                    href={whatsappUrl(summary)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle /> Send to Joy on WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn whatsapp"
                    onClick={() => go(6)}
                  >
                    <MessageCircle /> Prepare WhatsApp request
                  </button>
                )}
              </div>
              {step === 5 && (
                <div className="final-tools">
                  <button type="button" className="copy-link" onClick={copy}>
                    {copied ? <Check /> : null}
                    {copied ? "Request copied" : "Copy request instead"}
                  </button>
                  <details className="request-preview">
                    <summary>Review booking message</summary>
                    <pre>{summary}</pre>
                  </details>
                </div>
              )}
            </section>
            <aside>
              <span className="section-label">LIVE SUMMARY</span>
              <img
                src={selected.image}
                alt={`${service} selection`}
                onError={imgError}
              />
              <h2>{service}</h2>
              <dl>
                <div>
                  <dt>Shape</dt>
                  <dd>{shape}</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>{length}</dd>
                </div>
                <div>
                  <dt>Design</dt>
                  <dd>{design}</dd>
                </div>
                <div>
                  <dt>Colour</dt>
                  <dd>{customColour || colour}</dd>
                </div>
                <div>
                  <dt>Preferred date</dt>
                  <dd>{date || "Not selected"}</dd>
                </div>
              </dl>
              <p>
                <Sparkles /> Final price is provided after Joy reviews your
                choices.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
function BookingStep(p: any) {
  const d = p.data as BookingData;
  if (p.step === 0)
    return (
      <Panel title="Select a service" text="What would you like to book?">
        <div className="option-grid">
          {services.map((item) => (
            <Option
              selected={d.service === item.name}
              onClick={() => p.setService(item.name)}
              image={item.image}
              title={item.name}
              text={item.description}
              key={item.name}
            />
          ))}
        </div>
      </Panel>
    );
  if (p.step === 1)
    return (
      <Panel
        title="Choose a shape"
        text="Select the closest shape to your preferred look."
      >
        <div className="shape-grid">
          {shapes.map((item, index) => (
            <button
              type="button"
              className={d.shape === item ? "selected" : ""}
              onClick={() => p.setShape(item)}
              aria-pressed={d.shape === item}
              key={item}
            >
              <span className={`nail shape-${index}`} />
              <b>{item}</b>
              {d.shape === item && (
                <i>
                  <Check />
                </i>
              )}
            </button>
          ))}
        </div>
      </Panel>
    );
  if (p.step === 2)
    return (
      <Panel
        title="Choose a length"
        text="You can adjust the exact length during consultation."
      >
        <div className="length-grid">
          {lengths.map((item, index) => (
            <button
              type="button"
              className={d.length === item ? "selected" : ""}
              onClick={() => p.setLength(item)}
              aria-pressed={d.length === item}
              key={item}
            >
              <span style={{ height: 38 + index * 18 }} />
              <b>{item}</b>
              <small>
                {
                  [
                    "Easy everyday wear",
                    "Balanced and versatile",
                    "More room for art",
                    "Maximum impact",
                  ][index]
                }
              </small>
              {d.length === item && (
                <i>
                  <Check />
                </i>
              )}
            </button>
          ))}
        </div>
      </Panel>
    );
  if (p.step === 3)
    return (
      <Panel
        title="Choose your design"
        text="Pick a direction and colour, then add more detail later."
      >
        <div className="design-grid">
          {designs.map((item) => (
            <Option
              selected={d.design === item.name}
              onClick={() => p.setDesign(item.name)}
              image={item.image}
              title={item.name}
              text={item.description}
              key={item.name}
            />
          ))}
        </div>
        <div className="colour">
          <label htmlFor="custom-colour">Colour direction</label>
          <div>
            {swatches.map((item, index) => (
              <button
                type="button"
                className={
                  d.colour === item && !d.customColour ? "selected" : ""
                }
                aria-label={item}
                aria-pressed={d.colour === item && !d.customColour}
                style={{ background: swatchHex[index] }}
                onClick={() => {
                  p.setColour(item);
                  p.setCustomColour("");
                }}
                key={item}
              />
            ))}
          </div>
          <input
            id="custom-colour"
            value={d.customColour}
            onChange={(e: any) => p.setCustomColour(e.target.value)}
            placeholder="Or describe your preferred colour"
          />
        </div>
      </Panel>
    );
  if (p.step === 4)
    return (
      <Panel
        title="Choose a preferred date"
        text="Your date is a request until Joy confirms availability."
      >
        <label className="date-field">
          <CalendarDays />
          <span>
            <small>PREFERRED DATE *</small>
            <input
              required
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={d.date}
              onChange={(e: any) => p.setDate(e.target.value)}
            />
          </span>
        </label>
        <Info
          icon={<Sparkles />}
          title="Personal confirmation"
          text="Joy will review your date and confirm availability on WhatsApp."
        />
      </Panel>
    );
  return (
    <Panel
      title="Your details"
      text="Add the contact information for your booking request."
    >
      <div className="details">
        <label>
          <span>Full name *</span>
          <input
            required
            autoComplete="name"
            value={d.name}
            onChange={(e: any) => p.setName(e.target.value)}
            placeholder="Your full name"
          />
        </label>
        <label>
          <span>WhatsApp number</span>
          <input
            inputMode="tel"
            autoComplete="tel"
            value={d.phone}
            onChange={(e: any) => p.setPhone(e.target.value)}
            placeholder="+234..."
          />
        </label>
        <label className="wide">
          <span>Notes or inspiration</span>
          <textarea
            value={d.notes}
            onChange={(e: any) => p.setNotes(e.target.value)}
            placeholder="Describe your colour, details, occasion or inspiration..."
          />
        </label>
      </div>
      <Info
        icon={<MessageCircle />}
        title="Ready to send"
        text="Copy your request and paste it into your WhatsApp chat with Joy AD."
      />
    </Panel>
  );
}
function Option({
  selected,
  onClick,
  image,
  title,
  text,
}: {
  selected: boolean;
  onClick: () => void;
  image: string;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      className={selected ? "selected" : ""}
      onClick={onClick}
      aria-pressed={selected}
    >
      <img src={image} alt="" onError={imgError} />
      <span>
        <b>{title}</b>
        <small>{text}</small>
      </span>
      {selected && (
        <i>
          <Check />
        </i>
      )}
    </button>
  );
}
function Panel({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <header>
        <h2>{title}</h2>
        <p>{text}</p>
      </header>
      {children}
    </div>
  );
}
function Info({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="info">
      {icon}
      <p>
        <b>{title}</b>
        <span>{text}</span>
      </p>
    </div>
  );
}
function PageIntro({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="section-label">{label}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
function SectionHead({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <header className="section-head">
      <span className="section-label">{label}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </header>
  );
}
function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="logo" to="/" aria-label="DE_JOY ARTISTRY home">
          <b>DE_JOY</b>
          <span>ARTISTRY</span>
        </Link>
        <nav aria-label="Primary navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/book">Booking</NavLink>
        </nav>
        <Link className="header-book" to="/book">
          Book now <ArrowRight />
        </Link>
        <button
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <nav
        id="mobile-navigation"
        className={`mobile-nav ${open ? "open" : ""}`}
        aria-label="Mobile navigation"
      >
        <NavLink to="/">Home</NavLink>
        <NavLink to="/services">Services</NavLink>
        <NavLink to="/book">Booking</NavLink>
      </nav>
    </header>
  );
}
function FloatingWhatsApp() {
  return (
    <a
      className="floating-whatsapp"
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with DE_JOY ARTISTRY on WhatsApp"
    >
      <MessageCircle />
      <span>Chat with Joy</span>
    </a>
  );
}
function Legal({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  return (
    <>
      <PageIntro
        label="CLIENT INFORMATION"
        title={privacy ? "Privacy policy" : "Terms of use"}
        text={`Effective September 11, 2026. This notice explains ${privacy ? "how booking information is handled" : "the conditions for using this booking website"}.`}
      />
      <article className="legal container">
        {privacy ? (
          <>
            <h2>Information you choose to share</h2>
            <p>
              This website prepares a booking message from the name, contact
              number, appointment preferences, and notes you enter. The current
              website does not create an account, process payment, or store your
              form entries in its own database.
            </p>
            <h2>WhatsApp communication</h2>
            <p>
              When you choose to send your request, WhatsApp opens with your
              booking details. Your communication is then handled through
              WhatsApp and is subject to its own privacy practices.
            </p>
            <h2>How information is used</h2>
            <p>
              Information you send is used to review your request, discuss the
              service, confirm availability and price, and communicate about
              your appointment.
            </p>
            <h2>Your choices</h2>
            <p>
              You may decide not to include optional details. To ask about
              information previously shared, contact Joy through the WhatsApp
              link provided on this website.
            </p>
          </>
        ) : (
          <>
            <h2>Booking requests</h2>
            <p>
              Submitting or sending a request does not guarantee an appointment.
              A booking is confirmed only after Joy responds with availability
              and any required next steps.
            </p>
            <h2>Services and pricing</h2>
            <p>
              Images and service descriptions are provided as inspiration. Final
              design suitability, timing, and price depend on the selected
              service and are confirmed directly with Joy.
            </p>
            <h2>Client responsibility</h2>
            <p>
              Please provide accurate contact and booking information and
              disclose any relevant nail conditions or sensitivities before
              service. Do not rely on this website for medical advice.
            </p>
            <h2>Website use</h2>
            <p>
              You may use this website for genuine appointment enquiries.
              Content and branding may not be copied or republished without
              permission from DE_JOY ARTISTRY.
            </p>
          </>
        )}
      </article>
    </>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <Link className="logo" to="/">
            <b>DE_JOY</b>
            <span>ARTISTRY</span>
          </Link>
          <p>Bespoke nail artistry in Abuja, Nigeria.</p>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/book">Booking</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <small>
          © 2026 DE_JOY ARTISTRY
          <br />
          Abuja, Nigeria
        </small>
      </div>
    </footer>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
