from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import ast
import nltk
from nltk.stem import PorterStemmer
nltk.download('punkt')
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Allowing only specific origins
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

movies = pd.read_csv('tmdb_5000_movies.csv')
crew = pd.read_csv('tmdb_5000_credits.csv')
movies = movies.merge(crew, on='title')
movies = movies[['id', 'title', 'crew', 'overview', 'cast', 'genres', 'keywords']]

def extract_names(obj):
    return [i['name'] for i in ast.literal_eval(obj)]

def extract_top_cast(obj):
    return [i['name'] for i in ast.literal_eval(obj)[:5]]

def extract_director_producer(obj):
    return [i['name'] for i in ast.literal_eval(obj) if i['job'] in ['Director', 'Producer']]

movies['genres'] = movies['genres'].apply(extract_names)
movies['keywords'] = movies['keywords'].apply(extract_names)
movies['cast'] = movies['cast'].apply(extract_top_cast)
movies['crew'] = movies['crew'].apply(extract_director_producer)

movies['genres'] = movies['genres'].apply(lambda x: [i.replace(" ", "") for i in x])
movies['cast'] = movies['cast'].apply(lambda x: [i.replace(" ", "") for i in x])
movies['crew'] = movies['crew'].apply(lambda x: [i.replace(" ", "") for i in x])
movies['overview'] = movies['overview'].apply(lambda x: str(x).split())
movies['tags'] = movies['overview'] + movies['cast'] + movies['crew'] + movies['genres'] + movies['keywords']

reqdata = movies[['id', 'title', 'tags']]
reqdata.loc[:, 'tags'] = reqdata['tags'].apply(lambda x: " ".join(x))

ps = PorterStemmer()
def stem(text):
    return " ".join([ps.stem(i) for i in text.split()])

reqdata.loc[:, 'tags'] = reqdata['tags'].apply(stem)
cv = CountVectorizer(max_features=5000, stop_words='english')
vector = cv.fit_transform(reqdata['tags']).toarray()
similardist = cosine_similarity(vector)

@app.route("/recommend", methods=["POST"])
def recommend():
    movie = request.json['movie']
    if movie not in reqdata['title'].values:
        return jsonify({"error": "Movie not found"}), 404
    
    movie_index = reqdata[reqdata['title'] == movie].index[0]
    distance = similardist[movie_index]
    movielist = sorted(list(enumerate(distance)), reverse=True, key=lambda x: x[1])[1:7]
    
    recommended = [reqdata.iloc[i[0]].title for i in movielist]
    return jsonify({"recommendations": recommended})

@app.route("/movie-details", methods=["POST"])
def movie_details():
    movie = request.json['movie']
    if movie not in movies['title'].values:
        return jsonify({"error": "Movie not found"}), 404

    moviedata = movies[movies['title'] == movie].iloc[0]
    
    return jsonify({
        "title": moviedata['title'],
        "overview": " ".join(moviedata['overview']),
        "cast": moviedata['cast'],
        "genres": moviedata['genres'],
        "crew": moviedata['crew'],
        "keywords": moviedata['keywords']
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)