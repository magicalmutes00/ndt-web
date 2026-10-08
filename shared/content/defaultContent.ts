import { CONTENT_VERSION, type SiteContent } from "./schema.js";

/**
 * The compiled-in default content.
 *
 * This is both the seed for a fresh database and the last-resort fallback the
 * public site renders if the API is unreachable. It must therefore stay valid
 * against `siteContentSchema` at all times — `npm test` asserts that.
 */
export const defaultContent: SiteContent = {
  version: CONTENT_VERSION,

  settings: {
    name: "NDT",
    fullName: "NDT Institute & Services",
    tagline: "An ISO 9001:2015 Certified Organization",
    description:
      "Premier NDT training institute in Example City offering professional training by experts with 100% placement assistance.",
    domain: "example.com",
    email: "info@example.com",
    emailAlt: "training@example.com",
    phone: "+91 90000 00001",
    phoneAlt: "+91 90000 00002",
    phoneLandline: "+91 44 4000 0003",
    whatsapp: "https://wa.me/919000000001?text=I'm%20interested%20in%20NDT",
    address: {
      line1: "123 Example Street",
      line2: "Example Industrial Estate",
      city: "Example City",
      state: "Example State",
      pincode: "000000",
      country: "India",
      full: "123 Example Street, Example Industrial Estate, Example City, Example State 000000, India",
    },
    mapEmbed: "https://www.google.com/maps?q=Example%20City&output=embed",
    yearsExperience: 5,
  },

  nav: {
    links: [
      { label: "Home", path: "/" },
      { label: "About", path: "/about" },
      { label: "Courses", path: "/courses" },
      { label: "Services", path: "/services" },
      { label: "Placements", path: "/placements" },
      { label: "Gallery", path: "/gallery" },
      { label: "Testimonials", path: "/testimonials" },
      { label: "Contact", path: "/contact" },
    ],
  },

  footer: {
    blurb:
      "NDT Institute & Services — ISO 9001:2015 Certified NDT training institute offering professional training with 100% placement assistance.",
    social: [],
    columns: [
      {
        title: "Quick Links",
        items: [
          { label: "Home", path: "/" },
          { label: "About", path: "/about" },
          { label: "Courses", path: "/courses" },
          { label: "Services", path: "/services" },
          { label: "Contact", path: "/contact" },
        ],
      },
    ],
  },

  seo: {
    "/": {
      title: "Home",
      description:
        "Premier NDT training institute in Example City. ASNT Level II certified training with 100% placement assistance in Oil & Gas, Offshore & Shipyard.",
    },
    "/about": {
      title: "About",
      description:
        "Learn about NDT Institute & Services — ISO 9001:2015 certified NDT training institute in Example City with 5+ years of excellence and 100% placement assistance.",
    },
    "/courses": {
      title: "Courses",
      description:
        "ASNT Level II NDT certification courses — UT, RT, PT, MT, VT, ET. Hands-on training with globally recognized instruments.",
    },
    "/services": {
      title: "Services",
      description:
        "NDT training, certification, and manpower services by NDT Institute & Services. ASNT Level II, UT hands-on training, and job consultancy for Oil & Gas industries.",
    },
    "/placements": {
      title: "Placements",
      description:
        "100% placement assistance for NDT professionals. NDT Institute & Services provides job opportunities in India, UAE, Qatar, Singapore & Saudi Arabia across Oil & Gas, Offshore & Shipyard.",
    },
    "/gallery": {
      title: "Gallery",
      description:
        "Explore NDT Institute & Services' state-of-the-art facilities, training labs, and industrial equipment through our gallery.",
    },
    "/testimonials": {
      title: "Testimonials",
      description:
        "Hear from our successful NDT students. NDT Institute & Services has transformed careers with quality training and 100% placement support.",
    },
    "/contact": {
      title: "Contact",
      description:
        "Contact NDT Institute & Services for NDT training, certification, and manpower services.",
    },
    "/apply": {
      title: "Apply Now",
      description:
        "Apply for NDT training at NDT Institute & Services. Start your career in Non-Destructive Testing with ASNT Level II certification.",
    },
    "/privacy": {
      title: "Privacy Policy",
      description:
        "NDT Institute & Services privacy policy — how we collect, use, and protect your personal information.",
    },
    "/terms": {
      title: "Terms & Conditions",
      description:
        "Terms and conditions for using the NDT Institute & Services website and services.",
    },
  },

  collections: {
    courses: [
      {
        id: "ut",
        code: "UT",
        name: "Ultrasonic Testing",
        description:
          "Comprehensive ultrasonic testing training with hands-on experience using advanced equipment. Master flaw detection, thickness measurement, and weld inspection techniques.",
        duration: "2-4 Weeks",
        certification: "ASNT Level II",
        icon: "waves",
        topics: [
          "Equipment Handling (Modsonic, USM 35)",
          "V1, V2 Block Calibration",
          '19mm, 75mm, 12" Notch DAC Draw',
          "Lamination Detection",
          "Corrosion Mapping",
          "Erosion Mapping",
          "Weld Scan – Plate, Pipe & TKY",
          "Beam Profile",
        ],
      },
      {
        id: "rt",
        code: "RT",
        name: "Radiographic Testing",
        description:
          "Professional radiographic testing training covering film interpretation, radiation safety, and digital radiography techniques for industrial applications.",
        duration: "2-4 Weeks",
        certification: "ASNT Level II",
        icon: "radioactive",
        topics: [
          "Radiation Safety",
          "Film Interpretation",
          "Exposure Techniques",
          "IQI Selection",
          "Radiograph Evaluation",
          "Digital Radiography",
          "Code Compliance",
        ],
      },
      {
        id: "pt",
        code: "PT",
        name: "Penetrant Testing",
        description:
          "Hands-on penetrant testing training for surface flaw detection using visible and fluorescent dye penetrant methods.",
        duration: "1 Week",
        certification: "ASNT Level II",
        icon: "droplets",
        topics: [
          "Surface Preparation",
          "Solvent Removable Method",
          "Water Washable Method",
          "Post-Emulsifiable Method",
          "Indications Evaluation",
          "Reporting",
        ],
      },
      {
        id: "mt",
        code: "MT",
        name: "Magnetic Particle Testing",
        description:
          "Comprehensive magnetic particle inspection training for ferromagnetic material surface and subsurface flaw detection.",
        duration: "1 Week",
        certification: "ASNT Level II",
        icon: "magnet",
        topics: [
          "Magnetization Techniques",
          "Yoke Method",
          "Prods Method",
          "Central Conductor",
          "Coil Shot",
          "Indication Evaluation",
          "Demagnetization",
        ],
      },
      {
        id: "vt",
        code: "VT",
        name: "Visual Testing",
        description:
          "Visual inspection training covering direct and remote visual testing methods for welds, castings, and in-service components.",
        duration: "1 Week",
        certification: "ASNT Level II",
        icon: "eye",
        topics: [
          "Direct Visual Testing",
          "Remote Visual Testing",
          "Lighting Requirements",
          "Welding Discontinuities",
          "Corrosion Assessment",
          "Acceptance Criteria",
        ],
      },
      {
        id: "et",
        code: "ET",
        name: "Eddy Current Testing",
        description:
          "Advanced eddy current testing training for conductive material inspection, tube inspection, and surface crack detection.",
        duration: "2 Weeks",
        certification: "ASNT Level II",
        icon: "zap",
        topics: [
          "Electromagnetic Theory",
          "Probe Selection",
          "Impedance Plane",
          "Tube Inspection",
          "Surface Crack Detection",
          "Conductivity Measurement",
        ],
      },
    ],

    services: [
      {
        id: "asnt-level-2",
        title: "ASNT Level II Training & Certification",
        description:
          "Comprehensive NDT training and certification program covering all major testing methods with 100% placement assistance in India & Abroad.",
        features: [
          "Ultrasonic Testing",
          "Magnetic Particle Testing",
          "Penetrant Testing",
          "Radiographic Testing",
          "Visual Testing",
          "100% Placement Assistance",
        ],
        icon: "certificate",
      },
      {
        id: "ut-hands-on",
        title: "UT Hands-on Training",
        description:
          "Intensive hands-on ultrasonic testing training with industry-standard equipment and real-world inspection scenarios.",
        features: [
          "Equipment Handling (Modsonic, USM 35)",
          "V1, V2 Block Calibration",
          'Notch DAC Draw (19mm, 75mm, 12")',
          "Lamination & Corrosion Mapping",
          "Erosion Mapping",
          "Weld Scan – Plate, Pipe & TKY",
          "Beam Profile",
        ],
        icon: "hard-drive",
      },
      {
        id: "manpower",
        title: "Manpower Services & Job Consultancy",
        description:
          "Specialized NDT job consultancy providing qualified professionals for Oil & Gas, Offshore, and Shipyard industries across India and international locations.",
        features: [
          "ASNT Level II & III",
          "PCN Level 2 & 3",
          "ISO 9712 Level 2 & 3",
          "Painting Inspector (BGAS/NACE)",
          "Welding Inspector (CSWIP 3.1/3.2)",
          "API Inspectors (510/570/653/650)",
          "Rope Access (IRATA Level 1,2,3)",
          "UAE, Qatar, Singapore, Saudi & India",
        ],
        icon: "users",
      },
    ],

    stats: [
      { label: "Students Trained", value: 1500, suffix: "+", icon: "users" },
      { label: "Placement Rate", value: 100, suffix: "%", icon: "briefcase" },
      { label: "Partner Companies", value: 50, suffix: "+", icon: "building" },
      { label: "Years Experience", value: 5, suffix: "+", icon: "clock" },
    ],

    testimonials: [
      {
        id: "t1",
        name: "Student 1",
        role: "NDT Technician, Oil & Gas",
        avatar: "",
        content:
          "NDT Institute & Services transformed my career. The hands-on training with real equipment gave me the confidence to work in the field. Got placed within a month of completing the course.",
        rating: 5,
      },
      {
        id: "t2",
        name: "Student 2",
        role: "UT Level II, Shipyard",
        avatar: "",
        content:
          "The best NDT training institute in Example City. Expert instructors, well-equipped lab, and 100% placement support. Highly recommended for anyone serious about NDT.",
        rating: 5,
      },
      {
        id: "t3",
        name: "Student 3",
        role: "Quality Inspector",
        avatar: "",
        content:
          "Excellent training with affordable pricing. Free accommodation was a big help. The instructors are very knowledgeable and patient. Grateful for the placement assistance.",
        rating: 5,
      },
      {
        id: "t4",
        name: "Student 4",
        role: "ASNT Level II, Offshore",
        avatar: "",
        content:
          "Joined with zero experience in NDT. The practical training approach and industry exposure helped me become job-ready in weeks. Now working in a reputed offshore company.",
        rating: 5,
      },
      {
        id: "t5",
        name: "Student 5",
        role: "RT Level II, Fabrication",
        avatar: "",
        content:
          "Professional training environment with AC classrooms and modern equipment. The certification is globally recognized. I got multiple job offers after completing the course.",
        rating: 5,
      },
    ],

    gallery: [
      { id: "off1", src: "/images/gallery/off1.jpg", category: "Office", title: "NDT Institute Office", alt: "Reception area of the NDT Institute office" },
      { id: "off2", src: "/images/gallery/off2.jpg", category: "Office", title: "Training Session", alt: "Instructor leading a classroom training session" },
      { id: "off3", src: "/images/gallery/off3.jpg", category: "Office", title: "Lab Facility", alt: "NDT laboratory facility" },
      { id: "off4", src: "/images/gallery/off4.jpg", category: "Office", title: "Practical Training", alt: "Students during practical training" },
      { id: "off5", src: "/images/gallery/off5.jpg", category: "Office", title: "Classroom", alt: "Air conditioned classroom" },
      { id: "vt1", src: "/images/gallery/vt1.jpg", category: "Courses", title: "Visual Testing", alt: "Visual testing practical demonstration" },
      { id: "pt1", src: "/images/gallery/pt1.jpg", category: "Courses", title: "Penetrant Testing", alt: "Penetrant testing application" },
      { id: "mt1", src: "/images/gallery/mt1.jpg", category: "Courses", title: "Magnetic Particle Testing", alt: "Magnetic particle testing yoke in use" },
      { id: "rt1", src: "/images/gallery/rt1.jpg", category: "Courses", title: "Radiographic Testing", alt: "Radiographic testing film interpretation" },
      { id: "ut1", src: "/images/gallery/ut1.jpg", category: "Courses", title: "Ultrasonic Testing", alt: "Ultrasonic flaw detector calibration" },
      { id: "vt2", src: "/images/gallery/vt2.jpg", category: "Courses", title: "VT Training", alt: "Visual testing training session" },
      { id: "lab1", src: "/images/gallery/lab1.jpg", category: "Courses", title: "NDT Lab", alt: "NDT laboratory equipment" },
      { id: "lab2", src: "/images/gallery/lab2.jpg", category: "Courses", title: "Lab Equipment", alt: "Testing instruments on the lab bench" },
      { id: "ship1", src: "/images/gallery/ship1.jpg", category: "Other", title: "Ship Yard Services", alt: "NDT inspection at a shipyard" },
      { id: "shore1", src: "/images/gallery/shore1.jpg", category: "Other", title: "Offshore Services", alt: "Offshore platform inspection" },
      { id: "oil1", src: "/images/gallery/oil1.jpg", category: "Other", title: "Oil and Gas Services", alt: "Oil and gas refinery inspection" },
    ],

    specialties: [
      "A/C Class Room and Practical Room",
      "Teaching by Qualified, Experienced Personnel",
      "Globally Recognized Testing Instruments",
      "Free Accommodation",
      "Free Wi-Fi",
      "Affordable Price",
    ],

    whyChooseUs: [
      {
        title: "ISO 9001:2015 Certified",
        description:
          "Internationally recognized quality management system ensuring highest training standards.",
        icon: "award",
      },
      {
        title: "100% Placement Assistance",
        description:
          "Guaranteed job placement support in India & abroad across Oil & Gas, Offshore, and Shipyard.",
        icon: "briefcase",
      },
      {
        title: "Industry Expert Trainers",
        description:
          "Learn from qualified professionals with years of hands-on industrial NDT experience.",
        icon: "graduation-cap",
      },
      {
        title: "Modern Equipment",
        description:
          "Train on globally recognized testing instruments used in top industries worldwide.",
        icon: "microscope",
      },
    ],

    placementCountries: ["UAE", "Qatar", "Singapore", "Saudi Arabia", "India"],

    certifications: ["ISO", "IAF", "EGAC"],
  },
};

/** Deep clone so callers can never mutate the module-level default. */
export function cloneDefaultContent(): SiteContent {
  return structuredClone(defaultContent);
}
