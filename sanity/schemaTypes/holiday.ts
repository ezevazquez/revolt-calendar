import { defineField, defineType } from 'sanity'

export const holiday = defineType({
  name: 'holiday',
  title: 'Holiday',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Inamovible', value: 'inamovible' },
          { title: 'Trasladable', value: 'trasladable' },
          { title: 'No Laborable', value: 'no_laborable' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' },
          { title: 'Working Day', value: 'working' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      initialValue: 'pending',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isOfficial',
      title: 'Official Holiday',
      type: 'boolean',
      description: 'Is this an official government holiday?',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'startDate',
      status: 'status',
      type: 'type',
    },
    prepare({ title, subtitle, status, type }) {
      const statusEmoji = {
        pending: '⏳',
        approved: '✅',
        rejected: '❌',
        working: '💼',
        custom: '🏢',
      }
      
      return {
        title: `${statusEmoji[status as keyof typeof statusEmoji]} ${title}`,
        subtitle: `${subtitle} • ${type}`,
      }
    },
  },
})
