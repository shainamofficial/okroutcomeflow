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
  Linkedin
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">OutcomeFlow</div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button asChild>
                <Link to="/app">Go to App</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Finally, a roadmap and project management tool that actually connects{' '}
              <span className="text-info">strategy</span> to{' '}
              <span className="text-success">execution</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Define OKRs. Break them into initiatives. Assign real work. Track outcomes.
              All in one place. No more strategy decks disconnected from reality.
            </p>
            <div className="flex flex-wrap gap-4">
              {isLoggedIn ? (
                <Button size="lg" asChild>
                  <Link to="/app">Go to App <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => scrollToSection('how-it-works')}>
                See how it works
              </Button>
            </div>
          </motion.div>
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <HierarchyIllustration />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold mb-12">
            Every team has OKRs.<br />
            Almost nobody executes them well.
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            {[
              "OKR tools track outcomes but ignore real work.",
              "Project tools track tasks but ignore strategy.",
              "Teams waste hours stitching tools together."
            ].map((problem, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="bg-card border border-border rounded-lg p-6"
              >
                <p className="text-lg font-medium">{problem}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.p 
            {...fadeInUp}
            className="text-xl md:text-2xl font-semibold text-muted-foreground"
          >
            Strategy without execution is theatre.<br />
            Execution without strategy is chaos.
          </motion.p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-16">
            Meet OutcomeFlow.
          </motion.h2>
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
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-16">
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
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {i + 1}
                </div>
                <step.icon className="h-6 w-6 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why We're Different Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-4">
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
                className={`flex flex-col md:flex-row md:items-center gap-4 p-6 rounded-lg border ${
                  row.type === 'highlight' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card border-border'
                }`}
              >
                <div className="font-semibold md:w-1/3">{row.label}</div>
                <div className={row.type === 'highlight' ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                  {row.desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold text-center mb-16">
            What you get
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
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
                className="flex items-start gap-3 bg-card border border-border rounded-lg p-5"
              >
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="font-medium">{benefit}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold mb-12">
            Who it's for
          </motion.h2>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mb-8"
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
                className="flex items-center gap-2 bg-muted rounded-full px-5 py-2"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{audience}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.p {...fadeInUp} className="text-lg text-muted-foreground">
            If your company sets goals and runs projects, this is for you.
          </motion.p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
            Stop managing strategy in slides<br />
            and execution in chaos.
          </motion.h2>
          <motion.p {...fadeInUp} className="text-xl opacity-90 mb-8">
            Start your free trial in under a minute.
          </motion.p>
          <motion.div {...fadeInUp}>
            {isLoggedIn ? (
              <Button size="lg" variant="secondary" asChild>
                <Link to="/app">Go to App <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
          </motion.div>
          <motion.p {...fadeInUp} className="text-sm opacity-75 mt-4">
            No credit card required.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-muted-foreground">
            © OutcomeFlow. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <div className="flex items-center gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
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
    <div className="space-y-3 font-mono text-sm">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-info" />
        <span className="font-semibold">Objective: Increase user engagement</span>
      </div>
      <div className="ml-6 space-y-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground rotate-90" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>KR: Increase DAU by 40%</span>
            <span className="text-xs text-success font-semibold">On Track</span>
          </div>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span className="text-xs">Initiative: Launch push notifications</span>
          </div>
          <div className="ml-4 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Task: Design notification UI</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm border border-info bg-info/20" />
              <span>Task: Implement backend service</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground rotate-90" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>KR: Reduce churn to &lt;5%</span>
            <span className="text-xs text-warning font-semibold">At Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
