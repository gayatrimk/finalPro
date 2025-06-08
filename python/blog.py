import datetime
import os
import json
import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# File to store blogs data
BLOGS_FILE = 'blogs_data.json'

# Image collections for each topic
BLOG_IMAGES = {
    'serving_sizes': [
        'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # food scale with ingredients
        'https://images.pexels.com/photos/5908226/pexels-photo-5908226.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # portioned meal prep
        'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # measuring ingredients
        'https://images.pexels.com/photos/8107991/pexels-photo-8107991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # food portions on plate
    ],
    'food_labels': [
        'https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # nutrition label on food
        'https://images.pexels.com/photos/4873821/pexels-photo-4873821.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # food ingredients list
        'https://images.pexels.com/photos/4873838/pexels-photo-4873838.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # food package labels
        'https://images.pexels.com/photos/4873601/pexels-photo-4873601.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # reading food labels
    ],
    'artificial_colors': [
        'https://images.pexels.com/photos/1739748/pexels-photo-1739748.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # colorful candies
        'https://images.pexels.com/photos/2064359/pexels-photo-2064359.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # rainbow desserts
        'https://images.pexels.com/photos/1028425/pexels-photo-1028425.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # colored sweets
        'https://images.pexels.com/photos/2064358/pexels-photo-2064358.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # colorful treats
    ],
    'processed_foods': [
        'https://images.pexels.com/photos/2099767/pexels-photo-2099767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # packaged snacks
        'https://images.pexels.com/photos/4033165/pexels-photo-4033165.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # snack food aisle
        'https://images.pexels.com/photos/4033156/pexels-photo-4033156.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # processed food display
        'https://images.pexels.com/photos/3735216/pexels-photo-3735216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # snack selection
    ],
    'kids_marketing': [
        'https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # colorful cereal
        'https://images.pexels.com/photos/4110541/pexels-photo-4110541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # kids snacks
        'https://images.pexels.com/photos/4110543/pexels-photo-4110543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # fun food packaging
        'https://images.pexels.com/photos/4110548/pexels-photo-4110548.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # kids treats
    ],
    'food_cravings': [
        'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # dessert spread
        'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',     # pancakes
        'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',     # pizza
        'https://images.pexels.com/photos/2228559/pexels-photo-2228559.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # chocolate cookies
    ],
    'sustainable_packaging': [
        'https://images.pexels.com/photos/4873642/pexels-photo-4873642.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # eco food packaging
        'https://images.pexels.com/photos/4873559/pexels-photo-4873559.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # sustainable food containers
        'https://images.pexels.com/photos/4873568/pexels-photo-4873568.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',   # organic food packaging
        'https://images.pexels.com/photos/4873581/pexels-photo-4873581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'    # eco-friendly food storage
    ]
}

# Fixed set of pre-generated blogs
FIXED_BLOGS = [
    {
        'title': 'The Hidden Dangers of Misleading Serving Sizes',
        'snippet': 'This week, we\'re exposing the misleading serving sizes in food packaging. This common trick can lead to increased consumption of hidden sugars and other health problems.',
        'content': '''When you pick up a packaged food item, one of the first things you might check is the calorie count. However, what many consumers don't realize is how misleading serving sizes can significantly skew their perception of nutritional intake. Manufacturers often manipulate serving sizes to make their products appear healthier than they are.

The prevalence of hidden sugars in processed foods has reached alarming levels. These sweeteners appear under numerous names on ingredient lists, making it difficult for consumers to track their total sugar intake. Excessive sugar consumption has been linked to various health issues, including obesity, type 2 diabetes, and heart disease.

To protect yourself from these marketing tactics, follow these practical steps:
1. Read ingredient lists carefully, paying special attention to the first few items
2. Compare serving sizes with your actual portion sizes
3. Look beyond front-of-package claims and check the nutrition facts panel
4. Research unfamiliar ingredients before purchasing
5. Consider the overall nutritional value rather than focusing on single claims

Being an informed consumer is your best defense against misleading serving sizes and the health risks associated with hidden sugars. Take time to understand what you're eating, question marketing claims, and make choices based on real nutritional value rather than clever packaging.''',
        'image_category': 'serving_sizes'
    },
    {
        'title': 'Decoding Food Labels: How to Spot Health Halos',
        'snippet': 'Learn about the deceptive "health halo" effect in food marketing and how terms like "natural" and "organic" might be misleading you about nutritional value.',
        'content': '''The term "health halo" refers to the perception that a food is healthy based on a single claim. Words like "natural" or "organic" often create this halo effect, leading consumers to overlook other important nutritional factors.

Many products labeled as "healthy" or "natural" can still be high in calories, sugars, or unhealthy fats. The health halo effect can cause people to consume more calories than they intend, thinking they're making healthy choices.

Here's how to see through the health halo:
1. Always check the nutrition facts panel, not just front-of-package claims
2. Be skeptical of trendy health terms and marketing buzzwords
3. Compare similar products from different brands
4. Look at serving sizes and total calories
5. Check for added sugars and artificial ingredients

Remember that marketing terms like "natural" and "organic" don't automatically mean healthy. Focus on the actual nutritional content and ingredients rather than appealing packaging claims.''',
        'image_category': 'food_labels'
    },
    {
        'title': 'The Truth About Artificial Coloring in Food Packaging',
        'snippet': 'Discover how artificial food coloring affects both the appearance and potentially your health, and learn to make informed choices about colored food products.',
        'content': '''The vibrant colors in processed foods often catch our eye and make products more appealing. However, artificial coloring goes beyond mere aesthetics - these synthetic additives can mask the real quality of food and may have health implications.

Research has suggested potential links between artificial food colors and behavioral issues in children, allergic reactions, and other health concerns. While regulatory bodies consider approved food colors safe, many consumers are choosing to avoid them.

Follow these guidelines to make informed choices:
1. Look for products colored with natural ingredients
2. Be aware that "natural colors" can come from various sources
3. Check ingredient lists for specific color names (e.g., Red 40, Yellow 5)
4. Consider whether the color serves any purpose beyond appearance
5. Choose naturally colorful whole foods when possible

The best approach is to focus on whole, minimally processed foods that get their colors from nature. When buying packaged foods, prioritize those using natural coloring agents or no added colors at all.''',
        'image_category': 'artificial_colors'
    },
    {
        'title': 'Understanding Processed Food Ingredients',
        'snippet': 'A comprehensive guide to decoding complex ingredient lists and understanding what those long chemical names really mean for your health.',
        'content': '''Have you ever looked at a food label and felt overwhelmed by the long list of unfamiliar ingredients? You're not alone. Many processed foods contain numerous additives, preservatives, and artificial ingredients that can be difficult to understand.

While not all processed ingredients are harmful, it's important to know what you're consuming. Some common ingredients might be hiding behind scientific names, while others might be unnecessary additives used only for appearance or shelf life.

Here's your guide to being a more informed consumer:
1. Learn to identify common preservatives and their purposes
2. Understand that ingredients are listed by quantity (highest to lowest)
3. Be aware that one ingredient might be listed under multiple names
4. Know which additives are generally recognized as safe
5. Research any ingredients you don't recognize

Remember, the simpler the ingredient list, the better. Focus on whole foods and minimally processed options when possible.''',
        'image_category': 'processed_foods'
    },
    {
        'title': 'The Impact of Food Marketing on Children',
        'snippet': 'Explore how food marketing specifically targets children and what parents can do to help their kids make healthier food choices.',
        'content': '''Food marketing to children has become increasingly sophisticated, using everything from cartoon characters to social media influencers. This targeted advertising often promotes foods high in sugar, salt, and unhealthy fats, while making them appear fun and desirable to children.

Studies show that children are particularly vulnerable to marketing messages and may not understand the difference between entertainment and advertising. This can lead to poor food choices and the development of unhealthy eating habits that may persist into adulthood.

Here are strategies for parents and caregivers:
1. Teach children about advertising tactics and marketing tricks
2. Involve kids in grocery shopping and reading food labels
3. Make healthy foods fun and appealing at home
4. Limit exposure to food advertisements when possible
5. Encourage critical thinking about food choices

By helping children develop media literacy and healthy food relationships early, we can set them up for better eating habits throughout their lives.''',
        'image_category': 'kids_marketing'
    },
    {
        'title': 'The Science of Food Cravings',
        'snippet': 'Understanding why we crave certain foods and how to manage these cravings for better health and nutrition.',
        'content': '''Food cravings are complex physiological and psychological experiences that can significantly impact our eating habits. While occasional cravings are normal, understanding their triggers can help us make better food choices.

Scientists have found that cravings often relate to both nutritional needs and emotional states. Sometimes what we perceive as a craving for sweets might actually be our body's signal for energy, while salt cravings might indicate mineral needs.

Here's what you need to know about managing cravings:
1. Recognize the difference between hunger and cravings
2. Understand common craving triggers (stress, lack of sleep, etc.)
3. Plan balanced meals to prevent nutritional deficiencies
4. Find healthy alternatives to satisfy common cravings
5. Practice mindful eating techniques

By understanding and managing our cravings, we can maintain a healthier relationship with food and make better nutritional choices.''',
        'image_category': 'food_cravings'
    },
    {
        'title': 'Sustainable Food Packaging: What You Need to Know',
        'snippet': 'Learn about eco-friendly food packaging options and how your choices can impact both your health and the environment.',
        'content': '''As environmental consciousness grows, sustainable food packaging has become increasingly important. However, not all "eco-friendly" packaging is created equal, and some options might have hidden environmental or health impacts.

The challenge lies in finding packaging that protects food safety and freshness while minimizing environmental impact. Some materials might be recyclable but energy-intensive to produce, while others might be biodegradable but not suitable for all food types.

Consider these factors when evaluating food packaging:
1. Material type and recyclability in your area
2. Production energy and resource requirements
3. Chemical leaching potential into food
4. Practical storage and transportation needs
5. End-of-life disposal impact

Making informed choices about food packaging can help reduce your environmental footprint while ensuring food safety.''',
        'image_category': 'sustainable_packaging'
    }
]

# Keep track of which blogs have been used
used_blogs = set()

def get_random_image(category):
    """Returns a random image URL for the given category"""
    return random.choice(BLOG_IMAGES[category])

def get_next_blog():
    """Returns the next unused blog, resetting if all blogs have been used"""
    global used_blogs
    
    # If all blogs have been used, reset the tracking
    if len(used_blogs) >= len(FIXED_BLOGS):
        used_blogs.clear()
    
    # Find an unused blog
    for i, blog in enumerate(FIXED_BLOGS):
        if i not in used_blogs:
            used_blogs.add(i)
            # Get a random image for the blog's category
            return blog['title'], blog['snippet'], blog['content'], get_random_image(blog['image_category'])
    
    # This should never happen due to the reset above
    return FIXED_BLOGS[0]['title'], FIXED_BLOGS[0]['snippet'], FIXED_BLOGS[0]['content'], get_random_image(FIXED_BLOGS[0]['image_category'])

def load_stored_blogs():
    """Load blogs data from JSON file"""
    if os.path.exists(BLOGS_FILE):
        with open(BLOGS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_stored_blogs(blogs_data):
    """Save blogs data to JSON file"""
    with open(BLOGS_FILE, 'w') as f:
        json.dump(blogs_data, f, indent=2)

# Initialize stored_blogs from file
stored_blogs = load_stored_blogs()

@app.route('/blogs', methods=['GET'])
def get_blogs():
    """API endpoint to get blog posts"""
    global stored_blogs
    print("Received request for blogs")
    
    # If no blogs exist, generate initial set
    if not stored_blogs:
        print("No existing blogs, generating initial set...")
        current_date = datetime.date.today()
        for i in range(5):
            title, snippet, content, image = get_next_blog()
            blog_id = str(i + 1)
            stored_blogs[blog_id] = {
                'id': blog_id,
                'date': current_date.strftime('%Y-%m-%d'),
                'title': title,
                'snippet': snippet,
                'content': content,
                'image': image,
                'likes': 0,
                'comments': []
            }
            current_date += datetime.timedelta(days=7)
        
        # Save the initial blogs
        save_stored_blogs(stored_blogs)
    
    # Sort blogs by ID in ascending order (1,2,3,4,5)
    sorted_blogs = []
    for i in range(1, 6):  # Always maintain IDs 1-5
        blog_id = str(i)
        if blog_id in stored_blogs:
            sorted_blogs.append(stored_blogs[blog_id])
    
    print(f"Sending response with {len(sorted_blogs)} blogs in ascending order")
    return jsonify(sorted_blogs)

@app.route('/blogs/generate', methods=['POST'])
def generate_single_blog():
    """API endpoint to generate a single new blog post that becomes #1, shifting others down"""
    global stored_blogs
    
    # Shift existing blogs down one position (5 gets dropped automatically)
    for i in range(4, 0, -1):  # Start from 4 down to 1
        old_id = str(i)
        new_id = str(i + 1)
        if old_id in stored_blogs:
            stored_blogs[new_id] = stored_blogs[old_id]
            stored_blogs[new_id]['id'] = new_id
    
    # Generate new blog for position #1
    title, snippet, content, image = get_next_blog()
    new_blog = {
        'id': '1',
        'date': datetime.date.today().strftime('%Y-%m-%d'),
        'title': title,
        'snippet': snippet,
        'content': content,
        'image': image,
        'likes': 0,
        'comments': []
    }
    
    # Add new blog at position 1
    stored_blogs['1'] = new_blog
    save_stored_blogs(stored_blogs)
    
    print("Generated new blog at position 1, shifted existing blogs down")
    return jsonify(new_blog)

@app.route('/blogs/<int:blog_id>/like', methods=['POST'])
def like_blog(blog_id):
    """API endpoint to like a blog post"""
    blog_id = str(blog_id)  # Convert to string for JSON compatibility
    if blog_id in stored_blogs:
        stored_blogs[blog_id]['likes'] += 1
        save_stored_blogs(stored_blogs)  # Save after updating likes
        return jsonify({'likes': stored_blogs[blog_id]['likes']})
    return jsonify({'error': 'Blog not found'}), 404

@app.route('/blogs/<int:blog_id>/comment', methods=['POST'])
def add_comment(blog_id):
    """API endpoint to add a comment to a blog post"""
    blog_id = str(blog_id)  # Convert to string for JSON compatibility
    if blog_id not in stored_blogs:
        return jsonify({'error': 'Blog not found'}), 404
    
    data = request.get_json()
    comment = data.get('comment')
    if not comment:
        return jsonify({'error': 'Comment is required'}), 400
    
    new_comment = {
        'id': len(stored_blogs[blog_id]['comments']) + 1,
        'text': comment,
        'date': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    stored_blogs[blog_id]['comments'].append(new_comment)
    save_stored_blogs(stored_blogs)  # Save after adding comment
    return jsonify(new_comment)

@app.route('/blogs/debug', methods=['GET'])
def get_debug_info():
    """API endpoint to view backend data for debugging"""
    debug_info = {
        'total_blogs': len(stored_blogs),
        'blogs_data': stored_blogs,
        'total_likes': sum(blog['likes'] for blog in stored_blogs.values()),
        'total_comments': sum(len(blog['comments']) for blog in stored_blogs.values())
    }
    return jsonify(debug_info)

if __name__ == "__main__":
    print("Blog server starting...")
    print(f"Blogs data will be stored in: {os.path.abspath(BLOGS_FILE)}")
    print("Debug endpoint available at: http://127.0.0.1:5002/blogs/debug")
    app.run(host='0.0.0.0', port=5002)