from rest_framework import serializers
from django.contrib.auth.models import User
from .models import State, Company, ObligationType, Obligation, Submission, AuditLog, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','first_name','last_name','email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username','password','email','first_name','last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email',''),
            first_name=validated_data.get('first_name',''),
            last_name=validated_data.get('last_name',''),
        )
        return user

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    obligations_count = serializers.SerializerMethodField()
    pending_obligations = serializers.SerializerMethodField()
    delivered_obligations = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'cnpj', 'fantasy_name', 'email', 'phone', 'address', 
                 'responsible', 'active', 'created_at', 'updated_at', 'obligations_count',
                 'pending_obligations', 'delivered_obligations']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_obligations_count(self, obj):
        return obj.obligations.count()
    
    def get_pending_obligations(self, obj):
        from datetime import date
        current_month = date.today().strftime('%m/%Y')
        pending = 0
        for obligation in obj.obligations.filter(competence=current_month):
            # Considerar apenas submissions aprovadas
            if not obligation.submissions.filter(approval_status='approved').exists():
                pending += 1
        return pending
    
    def get_delivered_obligations(self, obj):
        from datetime import date
        current_month = date.today().strftime('%m/%Y')
        delivered = 0
        for obligation in obj.obligations.filter(competence=current_month):
            # Considerar apenas submissions aprovadas
            if obligation.submissions.filter(approval_status='approved').exists():
                delivered += 1
        return delivered

class SubmissionSerializer(serializers.ModelSerializer):
    approval_decision_by_username = serializers.CharField(source='approval_decision_by.username', read_only=True)
    is_effective = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id','obligation','delivered_by','delivered_at','delivery_date','receipt_file','comments',
                 'submission_type','batch_id','approval_status','approval_decision_at','approval_decision_by',
                 'approval_decision_by_username','approval_comment','is_effective']
        read_only_fields = ['delivered_by','delivered_at','approval_decision_at','approval_decision_by']

    def validate(self, data):
        obligation = data.get('obligation')
        submission_type = data.get('submission_type', 'original')
        
        # Verificar se já existe submission para esta obrigação
        if obligation:
            existing_submission = Submission.objects.filter(obligation=obligation).first()
            
            if existing_submission:
                # Se já existe uma submission original, só permitir retificadora
                if existing_submission.submission_type == 'original' and submission_type == 'original':
                    raise serializers.ValidationError(
                        'Já existe uma entrega original para esta obrigação. '
                        'Use o tipo "Retificadora" para fazer uma correção.'
                    )
                
                # Se já existe uma retificadora, permitir apenas outra retificadora
                if existing_submission.submission_type == 'retificadora' and submission_type == 'original':
                    raise serializers.ValidationError(
                        'Esta obrigação já possui entregas. '
                        'Use o tipo "Retificadora" para fazer uma nova correção.'
                    )
        
        return data

    def create(self, validated_data):
        validated_data['delivered_by'] = self.context['request'].user
        return super().create(validated_data)

class ObligationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObligationType
        fields = '__all__'

class ObligationSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    company_id = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), write_only=True, source='company')
    state = StateSerializer(read_only=True)
    state_id = serializers.PrimaryKeyRelatedField(queryset=State.objects.all(), write_only=True, source='state')
    obligation_type = ObligationTypeSerializer(read_only=True)
    obligation_type_id = serializers.PrimaryKeyRelatedField(queryset=ObligationType.objects.all(), write_only=True, source='obligation_type')
    responsible_user = UserSerializer(read_only=True)
    responsible_user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='responsible_user', required=False, allow_null=True)
    submissions = SubmissionSerializer(many=True, read_only=True)

    status = serializers.SerializerMethodField()

    def get_status(self, obj):
        # delivered if any APPROVED submission; late if past due without approved submission
        from datetime import date
        latest = obj.submissions.filter(approval_status='approved').order_by('-delivered_at').first()
        if latest:
            return 'entregue'
        return 'atrasado' if obj.due_date and obj.due_date < date.today() else 'pendente'

    class Meta:
        model = Obligation
        fields = ['id','company','company_id','state','state_id','obligation_type','obligation_type_id',
                 'obligation_name','competence','due_date','delivery_deadline','responsible_user','responsible_user_id',
                 'validity_start_date','validity_end_date','status','created_by','created_at','notes','submissions']
        read_only_fields = ['created_by','created_at']

    def validate(self, data):
        # Tratar campos vazios como None
        if 'responsible_user' in data and data['responsible_user'] == '':
            data['responsible_user'] = None
        if 'validity_start_date' in data and data['validity_start_date'] == '':
            data['validity_start_date'] = None
        if 'validity_end_date' in data and data['validity_end_date'] == '':
            data['validity_end_date'] = None
        if 'delivery_deadline' in data and data['delivery_deadline'] == '':
            data['delivery_deadline'] = None
        if 'notes' in data and data['notes'] == '':
            data['notes'] = None
            
        # Validar datas
        if data.get('validity_start_date') and data.get('validity_end_date'):
            if data['validity_start_date'] > data['validity_end_date']:
                raise serializers.ValidationError("Data inicial não pode ser posterior à data final")
        
        # Validar formato da competência
        if 'competence' in data:
            import re
            if not re.match(r'^\d{2}/\d{4}$', data['competence']):
                raise serializers.ValidationError("Competência deve estar no formato MM/AAAA")
                
        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    obligation = ObligationSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'obligation', 'type', 'priority', 'title', 'message', 
                 'is_read', 'created_at', 'read_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = AuditLog
        fields = ['id','user','action','model','object_id','timestamp','changes']
