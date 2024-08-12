# """
# URL configuration for quiz_project project.
#
# The `urlpatterns` list routes URLs to views. For more information please see:
#     https://docs.djangoproject.com/en/5.0/topics/http/urls/
# Examples:
# Function views
#     1. Add an import:  from my_app import views
#     2. Add a URL to urlpatterns:  path('', views. home, name='home')
# Class-based views
#     1. Add an import:  from other_app.views import Home
#     2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
# Including another URLconf
#     1. Import the include() function: from django.urls import include, path
#     2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """


from django.urls import path
from quiz_game import views

urlpatterns = [
    path('', views.index, name='index'),  # run directly page
    path('question/', views.create_question, name='question'),  # create question in postman
    path('get_question/', views.get_question, name='get_question'),  # get question for quiz
    path('get_questions/', views.get_questions, name='get_questions'),  # get question for admin
    path('create_question/', views.create_question, name='create_question'),    # if admin edit or add a new question
    path('delete_question/', views.delete_question, name='delete_question'),    # if admin want to delete
    path('register/', views.user_register, name='register'),    # register user or update exixting user
    path('quiz_submission/', views.submit_quiz, name='quiz_submission'),    # sumit quiz marks
    path('get_results/', views.get_results, name='get_results'),    # admin view results

   path('admin_login/', views.admin_login, name='admin_login'),
    path('check_superior_admin/', views.check_superior_admin, name='check_superior_admin'),
    path('fetch_admins/', views.fetch_admins, name='fetch_admins'),
    path('new_admin/', views.new_admin, name='new_admin'),
    path('save_admin/<int:admin_id>/', views.save_admin, name='save_admin'),
    path('delete_admin/<int:admin_id>/', views.delete_admin, name='delete_admin'),
    path('check_access/<int:admin_id>/<str:request_type>/', views.check_access, name='check_access'),
    path('view_requests/', views.view_requests, name='view_requests'),
    path('update_permission/<int:admin_id>/', views.update_permission, name='update_permission'),
    path('accept_request/<int:admin_id>/<str:request_type>/', views.accept_request, name='accept_request'),
    path('deny_request/<int:admin_id>/<str:request_type>/', views.deny_request, name='deny_request'),
]
