from django.db import models
from django.contrib.auth.models import User
import uuid

class State(models.Model):
    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=100)
    def __str__(self): return f"{self.code} - {self.name}"

class Company(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name="Código", help_text="Código único da empresa")
    name = models.CharField(max_length=200, verbose_name="Razão Social")
    cnpj = models.CharField(max_length=18, blank=True, null=True, verbose_name="CNPJ")
    fantasy_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nome Fantasia")
    email = models.EmailField(blank=True, null=True, verbose_name="E-mail")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    address = models.TextField(blank=True, null=True, verbose_name="Endereço")
    responsible = models.CharField(max_length=100, blank=True, null=True, verbose_name="Responsável")
    active = models.BooleanField(default=True, verbose_name="Ativo")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em", null=True, blank=True)
    
    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ['code']
    
    def __str__(self): 
        return f"[{self.code}] {self.name} ({self.cnpj})" if self.cnpj else f"[{self.code}] {self.name}"

class ObligationType(models.Model):
    RECURRENCE_CHOICES = [
        ('mensal', 'Mensal'),
        ('bimestral', 'Bimestral'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
        ('especifico', 'Data Específica'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='mensal', verbose_name="Recorrência")
    due_day = models.IntegerField(default=1, verbose_name="Dia de Vencimento", help_text="Dia do mês para vencimento (1-31)")
    
    def __str__(self): return self.name

class Obligation(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='obligations')
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='obligations')
    obligation_type = models.ForeignKey(ObligationType, on_delete=models.CASCADE)
    obligation_name = models.CharField(max_length=200, blank=True, null=True, verbose_name="Nome da Obrigação Acessória")
    competence = models.CharField(max_length=7)  # mm/aaaa
    due_date = models.DateField(verbose_name="Data de Vencimento")
    delivery_deadline = models.DateField(blank=True, null=True, verbose_name="Prazo de Entrega")
    
    # Novos campos solicitados
    responsible_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='responsible_obligations', verbose_name="Usuário Responsável")
    validity_start_date = models.DateField(verbose_name="Data Inicial de Validade", 
                                         help_text="Data de início do controle desta obrigação",
                                         null=True, blank=True)
    validity_end_date = models.DateField(verbose_name="Data Final de Validade", 
                                       help_text="Data de fim do controle desta obrigação",
                                       null=True, blank=True)
    
    # Campos originais
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_obligations')
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('company','state','obligation_type','competence')

    def __str__(self):
        return f"{self.company} - {self.obligation_type} - {self.state} ({self.competence})"

def receipt_upload_to(instance, filename):
    return f"receipts/{instance.obligation_id}/{filename}"

class Submission(models.Model):
    SUBMISSION_TYPE_CHOICES = [
        ('original', 'Original'),
        ('retificadora', 'Retificadora'),
    ]
    
    APPROVAL_STATUS_CHOICES = [
        ('pending_review', 'Pendente de Revisão'),
        ('approved', 'Aprovada'),
        ('rejected', 'Recusada'),
        ('needs_revision', 'Necessita Revisão'),
    ]
    
    obligation = models.ForeignKey(Obligation, on_delete=models.CASCADE, related_name='submissions')
    delivered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='deliveries')
    delivered_at = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateField()
    receipt_file = models.FileField(upload_to=receipt_upload_to, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    submission_type = models.CharField(max_length=20, choices=SUBMISSION_TYPE_CHOICES, default='original', verbose_name="Tipo de Entrega")
    batch_id = models.UUIDField(blank=True, null=True, verbose_name="ID do Lote", help_text="Para rastrear entregas em massa")
    
    # Campos de aprovação
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending_review', verbose_name="Status de Aprovação")
    approval_decision_at = models.DateTimeField(blank=True, null=True, verbose_name="Data da Decisão")
    approval_decision_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approval_decisions', verbose_name="Decisão por")
    approval_comment = models.TextField(blank=True, null=True, verbose_name="Comentário da Aprovação")
    
    @property
    def is_effective(self):
        """Retorna True apenas se a submissão foi aprovada"""
        return self.approval_status == 'approved'

class SubmissionAttachment(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255)
    parsed_cnpj = models.CharField(max_length=14, blank=True, null=True)
    parsed_period = models.CharField(max_length=6, blank=True, null=True, help_text="MMAAAA")
    parsed_obligation_key = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.original_filename} - {self.submission.obligation.company.name}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('due_soon', 'Vencimento Próximo'),
        ('overdue', 'Atrasado'),
        ('reminder', 'Lembrete'),
        ('system', 'Sistema'),
        ('approval', 'Aprovação'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    obligation = models.ForeignKey(Obligation, on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Dispatch(models.Model):
    CATEGORY_CHOICES = [
        ('NOTIFICACAO_FISCAL', 'Notificação Fiscal'),
        ('FISCALIZACAO', 'Fiscalização'),
        ('DESPACHO_DECISORIO', 'Despacho Decisório'),
    ]
    
    STATUS_CHOICES = [
        ('NAO_INICIADO', 'Não Iniciado'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDO', 'Concluído'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='dispatches')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200, blank=True, null=True, verbose_name="Título")
    responsible = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='responsible_dispatches', verbose_name="Responsável")
    start_date = models.DateField(verbose_name="Data Inicial")
    end_date = models.DateField(verbose_name="Data Final")
    progress_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0, 
                                     verbose_name="Progresso (%)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NAO_INICIADO')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_dispatches')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Despacho"
        verbose_name_plural = "Despachos"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.company.name} ({self.start_date} a {self.end_date})"
    
    def save(self, *args, **kwargs):
        # Recalcular progresso e status antes de salvar
        self.update_progress()
        super().save(*args, **kwargs)
    
    def update_progress(self):
        """Recalcula o progresso e status baseado nas subatividades"""
        subtasks = self.subtasks.all()
        total = subtasks.count()
        
        if total == 0:
            self.progress_pct = 0
            self.status = 'NAO_INICIADO'
        else:
            completed = subtasks.filter(status='CONCLUIDO').count()
            self.progress_pct = (completed / total) * 100
            
            if completed == total:
                self.status = 'CONCLUIDO'
            elif completed == 0:
                self.status = 'NAO_INICIADO'
            else:
                self.status = 'EM_ANDAMENTO'


class DispatchSubtask(models.Model):
    STATUS_CHOICES = [
        ('NAO_INICIADO', 'Não Iniciado'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDO', 'Concluído'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispatch = models.ForeignKey(Dispatch, on_delete=models.CASCADE, related_name='subtasks')
    name = models.CharField(max_length=200, verbose_name="Nome da Subatividade")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NAO_INICIADO')
    order = models.IntegerField(default=0, verbose_name="Ordem")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Subatividade"
        verbose_name_plural = "Subatividades"
        ordering = ['order', 'created_at']
        unique_together = ('dispatch', 'order')
    
    def __str__(self):
        return f"{self.name} - {self.dispatch.company.name}"
    
    def save(self, *args, **kwargs):
        # Se não tem ordem definida, usar a próxima disponível
        if not self.order:
            max_order = DispatchSubtask.objects.filter(dispatch=self.dispatch).aggregate(
                max_order=models.Max('order')
            )['max_order'] or 0
            self.order = max_order + 1
        
        super().save(*args, **kwargs)
        
        # Atualizar progresso do dispatch pai
        self.dispatch.update_progress()
        self.dispatch.save()


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20)  # created/updated/deleted
    model = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.timestamp} {self.user} {self.action} {self.model}({self.object_id})"