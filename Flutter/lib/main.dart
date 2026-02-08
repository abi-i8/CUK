import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glass_kit/glass_kit.dart';
import 'dart:ui';

void main() {
  runApp(const MyApp());
}

/* --- MODELS --- */
class Memory {
  final String title;
  final String date;
  final String? desc;
  final List<String> media;
  final String cover;

  Memory({
    required this.title,
    required this.date,
    this.desc,
    required this.media,
    required this.cover,
  });
}

// Sample Data (Mirroring Web)
final List<Memory> timelineMemories = [
  Memory(
    title: "Convocation",
    date: "11 NOV 2025",
    media: ["assets/events/convocation/1.jpg"],
    cover: "assets/events/convocation/1.jpg",
  ),
  Memory(
    title: "The Big Day",
    date: "04 SEP 2024",
    desc: "IYKYK",
    media: ["assets/events/bigday/1.jpg"],
    cover: "assets/events/bigday/1.jpg",
  ),
  Memory(
    title: "Freshers Day",
    date: "OCT 2023",
    desc: "INTROX 23",
    media: ["assets/events/freshers/1.jpg"],
    cover: "assets/events/freshers/1.jpg",
  ),
];

final List<String> highlightMedia = [
  "assets/highlights/1.jpg",
  "assets/highlights/2.jpg",
  "assets/highlights/3.jpg",
];

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'm.b.yeah Portfolio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        scaffoldBackgroundColor: const Color(0xFF050507),
      ),
      home: const PortfolioHomeScreen(),
    );
  }
}

class PortfolioHomeScreen extends StatefulWidget {
  const PortfolioHomeScreen({super.key});

  @override
  State<PortfolioHomeScreen> createState() => _PortfolioHomeScreenState();
}

class _PortfolioHomeScreenState extends State<PortfolioHomeScreen> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Background Globes Animation
          const BackgroundGlobes(),
          
          // 2. Main Content
          SafeArea(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() => _selectedIndex = index);
              },
              children: const [
                ExploreSection(),
                HighlightsSection(),
                EventsSection(),
              ],
            ),
          ),

          // 3. Bouncy Glass Navigation
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: GlassNavigation(
              selectedIndex: _selectedIndex,
              onItemSelected: (index) {
                setState(() => _selectedIndex = index);
                _pageController.animateToPage(
                  index,
                  duration: const Duration(milliseconds: 600),
                  curve: Curves.backOut,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/* --- BACKGROUND GLOBES --- */
class BackgroundGlobes extends StatefulWidget {
  const BackgroundGlobes({super.key});

  @override
  State<BackgroundGlobes> createState() => _BackgroundGlobesState();
}

class _BackgroundGlobesState extends State<BackgroundGlobes> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: -100 + (50 * _controller.value),
              left: -50 + (100 * _controller.value),
              child: Container(
                width: 300,
                height: 300,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [Color(0x304A00E0), Colors.transparent],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 150 - (50 * _controller.value),
              right: -100 + (100 * _controller.value),
              child: Container(
                width: 450,
                height: 450,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [Color(0x308E2DE2), Colors.transparent],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/* --- CUSTOM GLASS NAVIGATION --- */
class GlassNavigation extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;

  const GlassNavigation({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      height: 70,
      width: double.infinity,
      blur: 25,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Colors.white.withOpacity(0.08),
          Colors.white.withOpacity(0.03),
        ],
      ),
      borderGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Colors.white.withOpacity(0.2),
          Colors.white.withOpacity(0.05),
        ],
      ),
      borderRadius: BorderRadius.circular(35),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(0, "Explore"),
          _buildNavItem(1, "Highlights"),
          _buildNavItem(2, "Events"),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, String label) {
    bool isActive = selectedIndex == index;
    return GestureDetector(
      onTap: () => onItemSelected(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        curve: Curves.backOut,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? Colors.white.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: isActive 
            ? Border.all(color: Colors.white.withOpacity(0.1), width: 1)
            : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.white.withOpacity(0.4),
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
            fontSize: 13,
            letterSpacing: 1.5,
          ),
        ),
      ),
    );
  }
}

/* --- SECTIONS --- */

class ExploreSection extends StatelessWidget {
  const ExploreSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 50),
        borderRadius: BorderRadius.circular(32),
        blur: 35,
        gradient: LinearGradient(
          colors: [Colors.white.withOpacity(0.04), Colors.white.withOpacity(0.01)],
        ),
        borderGradient: LinearGradient(
          colors: [Colors.white.withOpacity(0.15), Colors.white.withOpacity(0.05)],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const StatusIndicator(),
            const SizedBox(height: 30),
            Text(
              "Explore Section",
              style: GoogleFonts.inter(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              "In Development, Launching Soon...",
              style: TextStyle(
                color: Colors.white.withOpacity(0.4),
                fontSize: 14,
                letterSpacing: 0.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class StatusIndicator extends StatefulWidget {
  const StatusIndicator({super.key});

  @override
  State<StatusIndicator> createState() => _StatusIndicatorState();
}

class _StatusIndicatorState extends State<StatusIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0x1000FF88),
        borderRadius: BorderRadius.circular(50),
        border: Border.all(color: const Color(0x3000FF88)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: Tween(begin: 0.8, end: 1.2).animate(
              CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
            ),
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Color(0xFF00FF88),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Color(0xFF00FF88), blurRadius: 10)],
              ),
            ),
          ),
          const SizedBox(width: 10),
          const Text(
            "SYSTEM: ONLINE",
            style: TextStyle(
              color: Color(0xFF00FF88),
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 3,
            ),
          ),
        ],
      ),
    );
  }
}

/* --- HIGHLIGHTS TUNNEL (3D CAROUSEL) --- */
class HighlightsSection extends StatelessWidget {
  const HighlightsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Center(
          child: PageView.builder(
            itemCount: 5, // Simulated tunnel items
            reverse: true,
            controller: PageController(viewportFraction: 0.7),
            itemBuilder: (context, index) {
              return AnimatedBuilder(
                animation: PageController(), // Placeholder for real scroll logic
                builder: (context, child) {
                  return Center(
                    child: Transform(
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001) // Perspective
                        ..translate(0.0, 0.0, -100.0 * index) // Depth
                        ..rotateY(0.1),
                      child: Container(
                        width: 280,
                        height: 400,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white.withOpacity(0.2), width: 4),
                          color: Colors.black45,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: const Center(child: Icon(Icons.play_circle_outline, size: 50, color: Colors.white24)),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
        const Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: Center(
            child: Text(
              "SWIPE TO EXPLORE TUNNEL",
              style: TextStyle(color: Colors.white24, letterSpacing: 4, fontSize: 10, fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    );
  }
}

/* --- EVENTS TIMELINE --- */
class EventsSection extends StatelessWidget {
  const EventsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.only(top: 20, bottom: 120, left: 20, right: 20),
      itemCount: timelineMemories.length,
      itemBuilder: (context, index) {
        final memory = timelineMemories[index];
        return IntrinsicHeight(
          child: Row(
            children: [
              // Vertical Line
              Column(
                children: [
                  Container(
                    width: 2,
                    height: 40,
                    color: Colors.white.withOpacity(0.1),
                  ),
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Colors.white.withOpacity(0.1),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 20),
              // Memory Card
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(0),
                    borderRadius: BorderRadius.circular(20),
                    blur: 20,
                    gradient: LinearGradient(
                      colors: [Colors.white.withOpacity(0.05), Colors.white.withOpacity(0.02)],
                    ),
                    borderGradient: LinearGradient(
                      colors: [Colors.white.withOpacity(0.1), Colors.white.withOpacity(0.05)],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Cover Placeholder
                        Container(
                          height: 180,
                          width: double.infinity,
                          color: Colors.white.withOpacity(0.05),
                          child: const Icon(Icons.image_outlined, color: Colors.white10, size: 40),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                memory.date,
                                style: GoogleFonts.inter(
                                  color: Colors.white.withOpacity(0.5),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                memory.title,
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              if (memory.desc != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  memory.desc!,
                                  style: TextStyle(color: Colors.white38, fontSize: 13),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
