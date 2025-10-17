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
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color code (e.g., #FF5733)',
      validation: (Rule) => Rule.regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'startDate',
    },
  },
})
