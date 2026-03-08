import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { 
  Target, 
  GitBranch, 
  Eye, 
  ClipboardList, 
  Layers, 
  LinkIcon, 
  RefreshCw,
  CheckCircle,
  Users,
  Zap,
  ArrowRight,
  Twitter,
  Linkedin,
  Sparkles,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" as Easing }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  },
  viewport: { once: true }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function LandingPage() {
  const { user, profile } = useAuth();
  const isLoggedIn = user && profile?.status === 'active';

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">O</span>
            </div>
            <span className="text-lg font-bold tracking-tight font-display">OutcomeFlow</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild className="gradient-primary border-0 shadow-glow">
                <Link to="/app">Go to App</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="gradient-primary border-0 shadow-glow">
                  <Link to="/signup">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-48 w-96 h-96 bg-primary-glow/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <motion.div {...fadeInUp}>
            <div className="inline-flex items-center gap-2 bg-accent rounded-full px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Strategy meets execution
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6 font-display">
              The project tool that{' '}
              <span className="gradient-text">connects strategy</span>{' '}
              to execution.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Define OKRs. Break them into initiatives. Assign real work. Track outcomes.
              All in one place. No more strategy decks disconnected from reality.
            </p>
            <div className="flex flex-wrap gap-4">
              {isLoggedIn ? (
                <Button size="lg" asChild className="gradient-primary border-0 shadow-glow h-12 px-8 text-base">
                  <Link to="/app">Go to App <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="gradient-primary border-0 shadow-glow h-12 px-8 text-base">
                  <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => scrollToSection('how-it-works')} className="h-12 px-8 text-base border-border/60">
                See how it works
              </Button>
            </div>
          </motion.div>
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-card-hover relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-primary-glow/[0.02]" />
              <div className="relative">
                <HierarchyIllustration />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-card border-y border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold mb-14 font-display">
            Every team has OKRs.<br />
            Almost nobody executes them well.
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-14"
          >
            {[
              "OKR tools track outcomes but ignore real work.",
              "Project tools track tasks but ignore strategy.",
              "Teams waste hours stitching tools together."
            ].map((problem, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="bg-background border border-border/60 rounded-xl p-6 text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <span className="text-destructive font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-base font-medium leading-relaxed">{problem}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.p 
            {...fadeInUp}
            className="text-xl md:text-2xl font-semibold text-muted-foreground font-display"
          >
            Strategy without execution is theatre.<br />
            Execution without strategy is chaos.
          </motion.p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display">
              Meet <span className="gradient-text">OutcomeFlow</span>.
            </h2>
          </motion.div>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Target,
                title: "Strategy built-in",
                desc: "Create Objectives and nested Key Results exactly the way your org thinks."
              },
              {
                icon: LinkIcon,
                title: "Execution connected",
                desc: "Link initiatives and tasks directly to KRs or multiple KRs. No more guessing what work matters."
              },
              {
                icon: Eye,
                title: "Visibility for everyone",
                desc: "Leaders see outcomes. Teams see work. Everyone stays aligned."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="text-center p-8 rounded-2xl border border-border/40 bg-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-3 font-display">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-card border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold text-center mb-16 font-display">
            How it works
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { icon: Target, title: "Define Objectives", desc: "Set your north star goals." },
              { icon: Layers, title: "Add Key Results", desc: "Break down into measurable outcomes." },
              { icon: ClipboardList, title: "Attach Work", desc: "Link initiatives and tasks." },
              { icon: RefreshCw, title: "Review & Adjust", desc: "Learn and iterate continuously." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="text-center relative"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold font-display">
                  {i + 1}
                </div>
                <step.icon className="h-6 w-6 mx-auto mb-3 text-primary" />
                <h3 className="font-bold mb-2 font-display">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why We're Different Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold text-center mb-4 font-display">
            Not another OKR tool.<br />
            Not another project tool.
          </motion.h2>
          <motion.p {...fadeInUp} className="text-xl text-center text-muted-foreground mb-16">
            The missing layer in between.
          </motion.p>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { label: "Other OKR tools", desc: "Great at tracking numbers. Terrible at tracking work.", type: "muted" },
              { label: "Project management tools", desc: "Great at tracking work. Terrible at tracking outcomes.", type: "muted" },
              { label: "OutcomeFlow", desc: "Tracks both. In one connected system.", type: "highlight" }
            ].map((row, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className={`flex flex-col md:flex-row md:items-center gap-4 p-6 rounded-xl border ${
                  row.type === 'highlight' 
                    ? 'gradient-primary text-primary-foreground border-transparent shadow-glow' 
                    : 'bg-card border-border/60'
                }`}
              >
                <div className="font-bold md:w-1/3 font-display">{row.label}</div>
                <div className={row.type === 'highlight' ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                  {row.desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-card border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold text-center mb-16 font-display">
            What you get
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-4"
          >
            {[
              "Clarity from top to bottom",
              "No more spreadsheet OKRs",
              "No more orphaned tasks",
              "Real ownership and accountability",
              "Faster reviews and decisions",
              "Teams that actually ship what matters"
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="flex items-start gap-3 bg-background border border-border/60 rounded-xl p-5 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                </div>
                <span className="font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold mb-12 font-display">
            Who it's for
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              "Product teams",
              "Founders & startup operators",
              "Strategy & operations leaders",
              "Engineering teams",
              "Marketing teams",
              "Sales teams"
            ].map((audience, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="flex items-center gap-2 bg-accent border border-border/40 rounded-full px-5 py-2.5"
              >
                <Users className="h-4 w-4 text-accent-foreground" />
                <span className="font-medium text-sm">{audience}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.p {...fadeInUp} className="text-lg text-muted-foreground">
            If your company sets goals and runs projects, this is for you.
          </motion.p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-28 px-6 gradient-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-extrabold mb-4 font-display">
            Stop managing strategy in slides<br />
            and execution in chaos.
          </motion.h2>
          <motion.p {...fadeInUp} className="text-xl opacity-90 mb-10">
            Start your free trial in under a minute.
          </motion.p>
          <motion.div {...fadeInUp}>
            {isLoggedIn ? (
              <Button size="lg" variant="secondary" asChild className="h-12 px-8 text-base font-semibold shadow-lg">
                <Link to="/app">Go to App <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" asChild className="h-12 px-8 text-base font-semibold shadow-lg">
                <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </motion.div>
          <motion.p {...fadeInUp} className="text-sm opacity-70 mt-5">
            No credit card required.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/40 bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md gradient-primary flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary-foreground">O</span>
            </div>
            <span className="text-sm text-muted-foreground">© OutcomeFlow. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <div className="flex items-center gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Hierarchy Illustration Component
function HierarchyIllustration() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-info/10 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-info" />
        </div>
        <span className="font-bold font-display">Objective: Increase user engagement</span>
      </div>
      <div className="ml-8 space-y-3 border-l-2 border-border/60 pl-5">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-success/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-success" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">KR: Increase DAU by 40%</span>
            <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">On Track</span>
          </div>
        </div>
        <div className="ml-8 space-y-2 border-l border-border/40 pl-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Initiative: Launch push notifications</span>
          </div>
          <div className="ml-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-success" />
              <span>Task: Design notification UI</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3.5 h-3.5 rounded border-2 border-info bg-info/20" />
              <span>Task: Implement backend service</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-warning/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-warning" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">KR: Reduce churn to &lt;5%</span>
            <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full">At Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
