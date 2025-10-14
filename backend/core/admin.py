from django.contrib import admin
from .models import State, Company, ObligationType, Obligation, Submission, SubmissionAttachment
admin.site.register(State)
admin.site.register(Company)
admin.site.register(ObligationType)
admin.site.register(Obligation)
admin.site.register(Submission)
admin.site.register(SubmissionAttachment)

from .models import AuditLog
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp','user','action','model','object_id')
    readonly_fields = ('user','action','model','object_id','timestamp','changes')
