import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Globe,
  GraduationCap,
  Rocket,
  Users,
} from "lucide-react";

const partnerTracks = [
  {
    title: "Academic",
    href: "/partners/academic",
    icon: GraduationCap,
    accent: "blue",
    body: "For universities, colleges, and bootcamps. Empower your students with AI-driven career tools and track their placement success.",
  },
  {
    title: "Business",
    href: "/partners/business",
    icon: Building2,
    accent: "purple",
    body: "For companies and HR teams. Access a clearer candidate-preparation workflow and streamline recruiting with AI-assisted context.",
  },
  {
    title: "Ambassadors",
    href: "/partners/students",
    icon: Users,
    accent: "pink",
    body: "For student leaders and community builders. Represent CareerVivid, support peers, and turn career readiness into visible leadership proof.",
  },
];

const impactPoints = [
  { icon: Globe, text: "Active in over 20 countries" },
  { icon: Award, text: "Award-winning AI technology" },
  { icon: Users, text: "Growing community of 50k+ professionals" },
];

const accentClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200 group-hover:border-blue-300",
  purple: "bg-[#f3f2ff] text-[#625bd5] border-[#d9d7ff] group-hover:border-[#bab6ff]",
  pink: "bg-rose-100 text-rose-700 border-rose-200 group-hover:border-rose-300",
};

export function PartnerLandingContent() {
  return (
    <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="relative overflow-hidden border-b border-gray-100 bg-gray-50 py-24 text-center transition-colors duration-500 dark:border-gray-900 dark:bg-gray-900 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/40 to-blue-50/40 dark:from-purple-900/10 dark:to-blue-900/10" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#8ab4f8_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-purple-700 shadow-sm backdrop-blur-sm dark:border-purple-800 dark:bg-gray-800/80 dark:text-purple-300">
            <Rocket size={16} />
            <span>Fueling the Future of Work</span>
          </div>

          <div className="mb-6">
            <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[0.98] tracking-tight text-gray-950 dark:text-white md:text-7xl lg:text-8xl">
              CareerVivid
              <span className="block text-blue-600">Academic/Business</span>
              <span className="block">Partner</span>
            </h1>
          </div>

          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-gray-600 dark:text-gray-300">
            Join us in our mission to empower the next generation of professionals. Whether you're an educator, a business leader, or a student, we have a program for you.
          </p>

          <a
            href="/partners/apply"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Become a Partner <ArrowRight size={20} />
          </a>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Choose Your Path</h2>
            <p className="text-gray-600 dark:text-gray-400">Discover which partnership program aligns with your goals.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {partnerTracks.map(({ title, href, icon: Icon, accent, body }) => (
              <a
                key={title}
                href={href}
                className="group relative rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
              >
                <div className={`absolute left-0 top-0 h-1 w-full origin-left scale-x-0 rounded-t-2xl transition-transform duration-300 group-hover:scale-x-100 ${accent === "blue" ? "bg-blue-500" : accent === "purple" ? "bg-purple-500" : "bg-pink-500"}`} />
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 ${accentClasses[accent]}`}>
                  <Icon size={28} />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="mb-6 min-h-[104px] text-gray-600 dark:text-gray-400">{body}</p>
                <span className={`flex items-center gap-2 font-semibold transition-all group-hover:gap-3 ${accent === "blue" ? "text-blue-600 dark:text-blue-400" : accent === "purple" ? "text-purple-600 dark:text-purple-400" : "text-pink-600 dark:text-pink-400"}`}>
                  Learn More <ArrowRight size={16} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-24 dark:border-gray-900 dark:bg-gray-950">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white">
              Global Impact. <br /> Local Reach.
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Our partners are at the forefront of the AI revolution in career development. By joining our ecosystem, you're not just getting tools; you're shaping the workforce of tomorrow.
            </p>
            <div className="space-y-4">
              {impactPoints.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                    <Icon size={20} />
                  </div>
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 scale-105 rotate-3 rounded-2xl bg-gradient-to-tr from-green-200 to-blue-200 opacity-50 dark:from-green-900/20 dark:to-blue-900/20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
              alt="Global Community"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-900 px-4 py-20 text-center dark:bg-black">
        <CheckCircle2 className="mx-auto mb-5 text-emerald-300" size={28} />
        <h2 className="mb-6 text-3xl font-bold text-white">Ready to make a difference?</h2>
        <a
          href="/partners/apply"
          className="inline-flex rounded-full bg-white px-10 py-4 text-lg font-bold text-gray-900 transition-colors hover:bg-gray-100"
        >
          Apply to Partner Program
        </a>
      </section>
    </main>
  );
}
