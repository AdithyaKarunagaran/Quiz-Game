import json
from datetime import datetime, timedelta
from django.db.models import Q
import pytz
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils.timezone import now, make_aware
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from quiz_game.models import  JSQuestion, User_Register, admin_model, AdminAccess



def index(request):
    print("Index view called")
    return render(request, 'quiz_game/index.html')

@csrf_exempt
@api_view(['POST', 'GET'])
def create_question(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        if 'id' not in data or data['id'] is None or data['id'] == "":
            JSQuestion.objects.create(
                question=data["question"],
                choices=data["choices"],
                answer=data["answer"],
                created_by=data["created_by"],
                created_date=now()
            )
            response_data = [{"Message": "New Question Created"}]
        else:
            JSQuestion.objects.filter(id=data["id"]).update(
                question=data["question"],
                choices=data["choices"],
                answer=data["answer"],
                update_by=data["updated_by"],
                update_date=now()
            )
            response_data = [{"Message": "Question updated"}, {'in-id': data['id']}]
        return JsonResponse(response_data, safe=False)


@csrf_exempt
@api_view(['POST'])
def delete_question(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        question_id = data.get('id')
        JSQuestion.objects.filter(id=question_id).delete()
        return JsonResponse({"Message": "Question deleted"}, safe=False)


@api_view(['GET'])
def get_questions(request):
    if request.method == 'GET':
        questions = JSQuestion.objects.all().values()
        return JsonResponse(list(questions), safe=False)


@csrf_exempt
@api_view(["GET"])
def get_question(request):
    if request.method == 'GET':
        obj = JSQuestion.objects.all()
        data = []
        for i in obj:
            questions = {
                "question": i.question,
                "choices": i.choices,
                "answer": i.answer
            }
            data.append(questions)
        return JsonResponse(data, safe=False)


@csrf_exempt
@api_view(["POST"])
def user_register(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user, created = User_Register.objects.get_or_create(
            e_mail=data["e_mail"],
            defaults={'name': data["name"], 'ph_no': data["ph_no"]}
        )
        if created:
            return JsonResponse({'Message': "New User Created"})
        else:
            return JsonResponse({'Message': "User already exists"})


@csrf_exempt
@require_http_methods(["POST"])
def submit_quiz(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = User_Register.objects.get(e_mail=data["e_mail"])
            score = data.get("score", 0)
            user.append_score(score)
            return JsonResponse({
                'Message': "Quiz Data Updated",

                'Total Attempts': user.quiz_attempts,
                'Scores': user.quiz_marks
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def get_results(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        # Parse the datetime string and convert it to an aware datetime object
        start_time = datetime.fromisoformat(data['start_time'])
        start_time = make_aware(start_time, pytz.timezone('Asia/Kolkata'))
        end_time = start_time + timedelta(hours=1)

        results = User_Register.objects.filter(updated_date__range=(start_time, end_time)).values(
            'name', 'quiz_attempts', 'quiz_marks', 'e_mail', 'ph_no'
        )

        # Process the results to include only the latest score
        processed_results = []
        for result in results:
            if result['quiz_marks']:
                latest_score = result['quiz_marks'][-1]  # Get the last score in the list
                result['latest_score'] = latest_score
            else:
                result['latest_score'] = None
            processed_results.append(result)

        return JsonResponse(processed_results, safe=False)


@csrf_exempt
def admin_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        admin_id = data.get("id")
        name = data.get("name")
        password = data.get("password")

        try:
            # Retrieve admin based on ID (you might use name instead)
            admin = admin_model.objects.get(id=admin_id)

            # Check if name and password match with case sensitivity
            if admin.name == name and admin.password == password:
                response_data = {"Message": "Admin authenticated"}
                return JsonResponse(response_data)
            else:
                response_data = {"Message": "Incorrect details"}
                return JsonResponse(response_data, status=400)

        except admin_model.DoesNotExist:
            response_data = {"Message": "Admin with provided ID not found"}
            return JsonResponse(response_data, status=400)


@csrf_exempt
def check_superior_admin(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        admin_id = data.get('id')

        try:
            admin = admin_model.objects.get(id=admin_id)

            if admin.is_superior:
                return JsonResponse({'is_superior': True})
            else:
                return JsonResponse({'is_superior': False})

        except admin_model.DoesNotExist:
            return JsonResponse({"Message": "Admin not found."}, status=404)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def check_access(request, admin_id, request_type):
    if request.method == 'POST':
        try:
            admin = get_object_or_404(admin_model, pk=admin_id)
            access, created = AdminAccess.objects.get_or_create(admin=admin)

            response_message = ""
            access_status = ""

            if request_type == 'edit_question':
                access_status = access.edit_question_status
                if access.edit_question_status == 'pending':
                    access.edit_question_status = 'waiting'
                    access.save()
                    response_message = "Request raised, waiting for approval."
                elif access.edit_question_status == 'waiting':
                    response_message = "Waiting for approval."
                elif access.edit_question_status == 'denied':
                    response_message = "Access denied."
                elif access.edit_question_status == 'approved':
                    return JsonResponse({'access': True, 'status': 'approved'})

            elif request_type == 'add_question':
                access_status = access.add_question_status
                if access.add_question_status == 'pending':
                    access.add_question_status = 'waiting'
                    access.save()
                    response_message = "Request raised, waiting for approval."
                elif access.add_question_status == 'waiting':
                    response_message = "Waiting for approval."
                elif access.add_question_status == 'denied':
                    response_message = "Access denied."
                elif access.add_question_status == 'approved':
                    return JsonResponse({'access': True, 'status': 'approved'})

            return JsonResponse({'access': False, 'Message': response_message, 'status': access_status})

        except admin_model.DoesNotExist:
            return JsonResponse({'error': 'Admin not found.'}, status=404)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)



# @csrf_exempt
# def new_admin(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             name = data.get('name')
#             password = data.get('password')

#             if not name or not password:
#                 return JsonResponse({'Message': 'Name and password are required.'}, status=400)

#             admin = admin_model.objects.create(name=name, password=password)
#             return JsonResponse({'Message': f'Admin "{admin.name}" added successfully.'})
#         except Exception as e:
#             return JsonResponse({'Message': str(e)}, status=500)


# @csrf_exempt
# def save_admin(request, admin_id):
#     if request.method == 'POST':
#         try:    
#             data = json.loads(request.body)
#             admin = get_object_or_404(admin_model, pk=admin_id)
#             admin.name = data.get("name")
#             admin.password = data.get("password")
#             admin.save()
#             return JsonResponse({'Message': f"Admin '{admin.name}' updated successfully."})
#         except Exception as e:
#             return JsonResponse({'Message': str(e)}, status=500)
    

# @csrf_exempt
# def delete_admin(request, admin_id):
#     if request.method == 'POST':
#         try:    
#             admin = get_object_or_404(admin_model, pk=admin_id)
#             admin.delete()
#             return JsonResponse({'Message': f"Admin '{admin.name}' deleted successfully."})
#         except Exception as e:
#                 return JsonResponse({'Message': str(e)}, status=500)


@csrf_exempt
def view_requests(request):
    if request.method == 'GET':
        try:
            admin_accesses = AdminAccess.objects.filter(
                Q(edit_question_status='waiting') | Q(add_question_status='waiting')
            )

            requests_data = []
            for access in admin_accesses:
                if access.edit_question_status == 'waiting':
                    requests_data.append({
                        'admin_id': access.admin.id,
                        'admin_name': access.admin.name,
                        'request_type': 'edit_question'
                    })
                if access.add_question_status == 'waiting':
                    requests_data.append({
                        'admin_id': access.admin.id,
                        'admin_name': access.admin.name,
                        'request_type': 'add_question'
                    })

            return JsonResponse(requests_data, safe=False)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

@csrf_exempt
def accept_request(request, admin_id, request_type):
    if request.method == 'POST':
        try:
            admin = get_object_or_404(admin_model, pk=admin_id)
            access, created = AdminAccess.objects.get_or_create(admin=admin)

            if request_type == 'edit_question':
                access.edit_question_status = 'approved'
            elif request_type == 'add_question':
                access.add_question_status = 'approved'

            access.save()
            return JsonResponse({'message': f'{request_type} request accepted successfully.'})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

@csrf_exempt
def deny_request(request, admin_id, request_type):
    if request.method == 'POST':
        try:
            admin = get_object_or_404(admin_model, pk=admin_id)
            access, created = AdminAccess.objects.get_or_create(admin=admin)

            if request_type == 'edit_question':
                access.edit_question_status = 'denied'
            elif request_type == 'add_question':
                access.add_question_status = 'denied'

            access.save()
            return JsonResponse({'message': f'{request_type} request denied.'})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)

    

def fetch_admins(request):
    try:
        admins = admin_model.objects.filter(is_superior=False)  # Exclude superior admins
        admins_data = []

        for admin in admins:
            admin_info = {
                'id': admin.id,
                'name': admin.name,
                'password': admin.password,
                'edit_question_status': admin.access.edit_question_status if admin.access else 'pending',
                'add_question_status': admin.access.add_question_status if admin.access else 'pending',
            }
            admins_data.append(admin_info)

        return JsonResponse(admins_data, safe=False)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def new_admin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_admin = admin_model.objects.create(
                name=data['name'],
                password=data['password']
            )
            return JsonResponse({'message': 'Admin added successfully.'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)
    

@csrf_exempt
def save_admin(request, admin_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            admin = admin_model.objects.get(pk=admin_id)
            admin.name = data['name']
            admin.password = data['password']
            admin.save()
            return JsonResponse({'message': 'Admin updated successfully.'})
        except admin_model.DoesNotExist:
            return JsonResponse({'error': 'Admin not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)
    

@csrf_exempt
def delete_admin(request, admin_id):
    if request.method == 'DELETE':
        try:
            admin = admin_model.objects.get(pk=admin_id)
            admin.delete()
            return JsonResponse({'message': 'Admin deleted successfully.'})
        except admin_model.DoesNotExist:
            return JsonResponse({'error': 'Admin not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)
    

@csrf_exempt
def update_permission(request, admin_id):
    if request.method == 'POST':
        try:
            admin = admin_model.objects.get(id=admin_id)
            access = admin.access  # Assuming OneToOneField link

            data = json.loads(request.body)
            if 'edit_question' in data:
                if data['edit_question']:
                    access.edit_question_status = 'approved'
                else:
                    access.edit_question_status = 'pending'

            if 'add_question' in data:
                if data['add_question']:
                    access.add_question_status = 'approved'
                else:
                    access.add_question_status = 'pending'

            access.save()

            return JsonResponse({'success': True, 'message': 'Permissions updated successfully.'})

        except admin_model.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Admin not found.'}, status=404)

        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)

    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)