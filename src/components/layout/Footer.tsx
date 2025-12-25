import { motion } from "framer-motion";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";
const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "API"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Documentation", "Help Center", "Webinars", "Case Studies"],
  Legal: ["Privacy", "Terms", "Security", "GDPR"]
};
const socialLinks = [{
  name: "Twitter",
  icon: Twitter,
  href: "#"
}, {
  name: "LinkedIn",
  icon: Linkedin,
  href: "#"
}, {
  name: "GitHub",
  icon: Github,
  href: "#"
}];
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};
const Footer = () => {
  return <footer className="bg-foreground text-background py-16 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{
        once: true,
        margin: "-100px"
      }} className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <motion.a href="/" className="flex items-center gap-2 mb-4 group" whileHover={{
            scale: 1.02
          }}>
              <motion.div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" whileHover={{
              rotate: 360
            }} transition={{
              duration: 0.5
            }}>
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold">ResumeAI</span>
            </motion.a>
            <p className="text-background/70 text-sm mb-6 max-w-xs">
              AI-powered resume screening and HR automation platform. Find the best candidates faster with NLP technology.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => <motion.a key={social.name} href={social.href} initial={{
              opacity: 0,
              scale: 0
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1 + 0.3
            }} whileHover={{
              scale: 1.2,
              y: -2
            }} whileTap={{
              scale: 0.9
            }} className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors" aria-label={social.name}>
                  <social.icon className="w-5 h-5" />
                </motion.a>)}
            </div>
          </motion.div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => <motion.div key={category} variants={itemVariants}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link, linkIndex) => <motion.li key={link} initial={{
              opacity: 0,
              x: -10
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: categoryIndex * 0.1 + linkIndex * 0.05
            }}>
                    <motion.a href="#" className="text-sm text-background/70 hover:text-background transition-colors inline-block" whileHover={{
                x: 4
              }}>
                      {link}
                    </motion.a>
                  </motion.li>)}
              </ul>
            </motion.div>)}
        </motion.div>

        {/* Bottom */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        delay: 0.5
      }} className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © 2024 ResumeAI. All rights reserved.
          </p>
          <motion.p className="text-sm text-background/50" whileHover={{
          scale: 1.02
        }}>
        </motion.p>
        </motion.div>
      </div>
    </footer>;
};
export default Footer;